package traverser

import (
	"backend/internal/matcher"
	"backend/internal/model"
	"backend/internal/parser"
)

func TraverseBFS(root *model.DOMNode, selector string, maxResults int) ([]*model.DOMNode, int, []model.TraversalStep) {
	var results []*model.DOMNode
	var log []model.TraversalStep
	var queue []*model.DOMNode
	nodesVisited := 0

	if root == nil || selector == "" {
		return results, nodesVisited, log
	}

	steps := parser.ParseCSSSelector(selector)
	if len(steps) == 0 {
		return results, nodesVisited, log
	}

	queue = append(queue, root)

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		nodesVisited++

		matched := matcher.MatchNode(current, steps)

		log = append(log, model.TraversalStep{
			NodeID:  current.ID,
			Tag:     current.Tag,
			Matched: matched,
		})

		if matched {
			results = append(results, current)
			if maxResults > 0 && len(results) >= maxResults {
				break
			}
		}

		for i := range current.Children {
			queue = append(queue, current.Children[i])
		}
	}
	return results, nodesVisited, log
}