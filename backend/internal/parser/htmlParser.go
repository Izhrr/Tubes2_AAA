package parser

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/net/html"

	"backend/internal/model"
)

// void elements / self-closing tags
var voidElements = map[string]bool{
	"area": true, "base": true, "br": true, "col": true,
	"embed": true, "hr": true, "img": true, "input": true,
	"link": true, "meta": true, "param": true, "source": true,
	"track": true, "wbr": true,
}

func ParseHTML(htmlStr string) (*model.DOMNode, int, int, error) {
	tokenizer := html.NewTokenizer(strings.NewReader(htmlStr))

	root := &model.DOMNode{
		ID:         uuid.New().String(),
		Tag:        "#document",
		Attributes: map[string]string{},
		Children:   []*model.DOMNode{},
		Depth:      -1,
		Parent:     nil,
	}

	stack := []*model.DOMNode{root}
	nodeCount := 0
	maxDepth := 0

	for {
		tokenType := tokenizer.Next()

		if tokenType == html.ErrorToken {
			// EOF
			break
		}

		current := stack[len(stack)-1]

		switch tokenType {

		case html.StartTagToken, html.SelfClosingTagToken:
			name, hasAttr := tokenizer.TagName()
			tag := string(name)

			depth := current.Depth + 1
			if depth > maxDepth {
				maxDepth = depth
			}
			nodeCount++

			node := &model.DOMNode{
				ID:         uuid.New().String(),
				Tag:        tag,
				Attributes: map[string]string{},
				Children:   []*model.DOMNode{},
				Depth:      depth,
				Parent:     current,
			}

			for hasAttr {
				var key, val []byte
				key, val, hasAttr = tokenizer.TagAttr()
				node.Attributes[string(key)] = string(val)
			}

			current.Children = append(current.Children, node)

			// handle void dan self closing tag
			if !voidElements[tag] && tokenType != html.SelfClosingTagToken {
				stack = append(stack, node)
			}

		case html.EndTagToken:
			name, _ := tokenizer.TagName()
			tag := string(name)

			for len(stack) > 1 {
				top := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				if top.Tag == tag {
					break
				}
			}

		case html.TextToken:
			text := strings.TrimSpace(string(tokenizer.Text()))
			if text == "" {
				continue
			}

			depth := current.Depth + 1
			if depth > maxDepth {
				maxDepth = depth
			}
			nodeCount++

			textNode := &model.DOMNode{
				ID:         uuid.New().String(),
				Tag:        "#text",
				Attributes: map[string]string{"content": text},
				Children:   []*model.DOMNode{},
				Depth:      depth,
				Parent:     current,
			}

			current.Children = append(current.Children, textNode)
		}
	}

	var htmlRoot *model.DOMNode
	for _, child := range root.Children {
		if child.Tag == "html" {
			htmlRoot = child
			break
		}
	}

	if htmlRoot == nil {
		if len(root.Children) == 0 {
			return nil, 0, 0, errors.New("no valid HTML elements found")
		}
		htmlRoot = root.Children[0]
	}

	htmlRoot.Parent = nil

	return htmlRoot, nodeCount, maxDepth, nil
}