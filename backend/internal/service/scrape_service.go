package service

import (
	"errors"

	"backend/internal/model"
	"backend/internal/parser"
	"backend/internal/scraper"
)

func ProcessScrape(req model.ScrapeRequest) (model.ScrapeResponse, error) {
	var htmlStr string
	var err error

	if req.HTML != "" {
		htmlStr = req.HTML
	} else if req.URL != "" {
		htmlStr, err = scraper.FetchHTML(req.URL)
		if err != nil {
			return model.ScrapeResponse{}, err
		}
	} else {
		return model.ScrapeResponse{}, errors.New("invalid input")
	}

	tree, count, depth, err := parser.ParseHTML(htmlStr)
	if err != nil {
		return model.ScrapeResponse{}, err
	}
	

	return model.ScrapeResponse{
		DOMTree:   tree,
		NodeCount: count,
		MaxDepth:  depth,
	}, nil
}