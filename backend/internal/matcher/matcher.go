package matcher

import (
	"slices"
	"backend/internal/model"
	"strings"
)

func MatchNode(node *model.DOMNode, steps []model.Step) bool {
	n := len(steps)
	if n == 0 {
		return false
	}

	if !matchStep(node, steps[n-1]) {
		return false
	}

	current := node

	for i := n - 2; i >= 0; i-- {
		step := steps[i]

		switch step.Combinator {
		case ">": // match parent
			current = current.Parent
			if current == nil || !matchStep(current, step) {
				return false
			}

		case " ": // match ancestors
			found := false
			current = current.Parent
			for current != nil {
				if matchStep(current, step) {
					found = true
					break
				}
				current = current.Parent
			}
			if !found {
				return false
			}

		case "+": // match direct previous sibling
			sib := prevSibling(current)
			if sib == nil || !matchStep(sib, step) {
				return false
			}
			current = sib

		case "~": // match all preceding sibling
			found := false
			sib := prevSibling(current)
			for sib != nil {
				if matchStep(sib, step) {
					current = sib
					found = true
					break
				}
				sib = prevSibling(sib)
			}
			if !found {
				return false
			}

		default:
			return false
		}
	}
	return true
}

func matchStep(node *model.DOMNode, step model.Step) bool {
	// tag
	if step.Tag != "" && step.Tag != "*" && node.Tag != step.Tag {
		return false
	}
	// class
	for _, cls := range step.Classes {
		if !hasClass(node, cls) {
			return false
		}
	}
	// ID
	if step.ID != "" {
		htmlID := node.Attributes["id"]
		if htmlID != step.ID {
			return false
		}
	}
	// attribute
	if step.AttrKey != "" {
		val, ok := node.Attributes[step.AttrKey]
		if !ok {
			return false
		}
		if step.AttrValue != "" && val != step.AttrValue {
			return false
		}
	}
	return true
}

func prevSibling(node *model.DOMNode) *model.DOMNode {
	if node.Parent == nil {
		return nil
	}
	siblings := node.Parent.Children
	for i, s := range siblings {
		if s == node && i > 0 {
			return siblings[i-1]
		}
	}
	return nil
}

func hasClass(node *model.DOMNode, class string) bool {
	classAttr, ok := node.Attributes["class"]
	if !ok {
		return false
	}
	return slices.Contains(strings.Fields(classAttr), class)
}