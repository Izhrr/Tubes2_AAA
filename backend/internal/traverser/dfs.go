package traverser

import (
	"backend/internal/matcher"
	"backend/internal/model"
	"backend/internal/parser"
)

func TraverseDFS(root *model.DOMNode, selector string, maxResults int) ([]*model.DOMNode, int, []model.TraversalStep) {
	var results []*model.DOMNode
	var log []model.TraversalStep
	var stack []*model.DOMNode
	nodesVisited := 0

	if root == nil || selector == "" {
		return results, nodesVisited, log
	}

	steps := parser.ParseCSSSelector(selector)
	if len(steps) == 0 {
		return results, nodesVisited, log
	}

	stack = append(stack, root)

	for len(stack) > 0 {
		current := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
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

		for i := len(current.Children) - 1; i >= 0; i-- {
			stack = append(stack, current.Children[i])
		}
	}
	return results, nodesVisited, log
}
