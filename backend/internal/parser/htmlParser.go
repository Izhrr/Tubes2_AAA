package parser

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/net/html"

	"backend/internal/model"
)

func ParseHTML(htmlStr string) (*model.DOMNode, int, int, error) {
	doc, err := html.Parse(strings.NewReader(htmlStr))
	if err != nil {
		return nil, 0, 0, err
	}

	nodeCount := 0
	maxDepth := 0

	root := buildTree(doc, nil, 0, &nodeCount, &maxDepth)

	if root == nil {
		return nil, 0, 0, errors.New("no valid HTML elements found")
	}

	return root, nodeCount, maxDepth, nil
}

func buildTree(n *html.Node, parent *model.DOMNode, depth int, nodeCount *int, maxDepth *int) *model.DOMNode {

	// skip non-element
	if n.Type != html.ElementNode {
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			res := buildTree(c, parent, depth, nodeCount, maxDepth)
			if res != nil {
				return res
			}
		}
		return nil
	}

	id := uuid.New().String()

	if depth > *maxDepth {
		*maxDepth = depth
	}

	*nodeCount++

	node := &model.DOMNode{
		ID:         id,
		Tag:        n.Data,
		Attributes: map[string]string{},
		Children:   []*model.DOMNode{},
		Depth:      depth,
		Parent:     parent,
	}

	// attributes
	for _, attr := range n.Attr {
		node.Attributes[attr.Key] = attr.Val
	}

	// children
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		child := buildTree(c, node, depth+1, nodeCount, maxDepth)
		if child != nil {
			node.Children = append(node.Children, child)
		}
	}

	return node
}