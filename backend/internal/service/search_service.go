package service

import (
	"errors"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/parser"
	"backend/internal/scraper"
	"backend/internal/traverser"
)

func ProcessSearch(req model.SearchRequest) (model.SearchResponse, error) {
	var htmlStr string
	var err error
	if req.HTML != "" {
		htmlStr = req.HTML
	} else if req.URL != "" {
		htmlStr, err = scraper.FetchHTML(req.URL)
		if err != nil {
			return model.SearchResponse{}, err
		}
	} else {
		return model.SearchResponse{}, errors.New("invalid input: must provide HTML or URL")
	}

	tree, count, depth, err := parser.ParseHTML(htmlStr)
	if err != nil {
		return model.SearchResponse{}, err
	}

	var results []*model.DOMNode
	var visited int
	var log []model.TraversalStep

	start := time.Now()

	if req.CSSSelector != "" {
		algo := strings.ToLower(req.Algorithm)
		if algo == "dfs" {
			results, visited, log = traverser.TraverseDFS(tree, req.CSSSelector, req.MaxResults)
		} else {
			results, visited, log = traverser.TraverseBFS(tree, req.CSSSelector, req.MaxResults)
		}
	} else {
		results = []*model.DOMNode{}
		log = []model.TraversalStep{}
	}

	duration := time.Since(start)
	return model.SearchResponse{
		DOMTree:      tree,
		NodeCount:    count,
		MaxDepth:     depth,
		ExecutionMs:  duration.Milliseconds(),
		NodesVisited: visited,
		Results:      results,
		TraversalLog: log,
	}, nil
}
