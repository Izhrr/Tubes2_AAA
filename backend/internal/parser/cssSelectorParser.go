package parser

import (
	"unicode"
	"backend/internal/model"
)

func ParseCSSSelector(selector string) []model.Step {
	var steps []model.Step
	n := len(selector)
	i := 0

	for i < n {
		// skip leading spaces
		for i < n && selector[i] == ' ' {
			i++
		}
		if i >= n {
			break
		}

		step := model.Step{}
		spaceBefore := false

		// parse tag name or *
		if i < n && (unicode.IsLetter(rune(selector[i])) || selector[i] == '*') {
			if selector[i] == '*' {
				step.Tag = "*"
				i++
			} else {
				start := i
				for i < n {
					r := rune(selector[i])
					if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_' {
						i++
					} else {
						break
					}
				}
				step.Tag = selector[start:i]
			}
		}

		// parse class, id, and attribute
		for i < n {
			r := selector[i]

			if r == '.' {
				i++ // skip '.'
				start := i
				for i < n {
					rr := rune(selector[i])
					if unicode.IsLetter(rr) || unicode.IsDigit(rr) || rr == '-' || rr == '_' {
						i++
					} else {
						break
					}
				}
				if start < i {
					step.Classes = append(step.Classes, selector[start:i])
				}

			} else if r == '#' {
				i++ // skip '#'
				start := i
				for i < n {
					rr := rune(selector[i])
					if unicode.IsLetter(rr) || unicode.IsDigit(rr) || rr == '-' || rr == '_' {
						i++
					} else {
						break
					}
				}
				if start < i {
					step.ID = selector[start:i]
				}

			} else if r == '[' {
				i++ // skip '['

				// key
				start := i
				for i < n && selector[i] != '=' && selector[i] != ']' {
					i++
				}
				key := selector[start:i]

				value := ""
				if i < n && selector[i] == '=' {
					i++ // skip '='

					// handle optional quotes
					if i < n && (selector[i] == '"' || selector[i] == '\'') {
						quote := selector[i]
						i++
						start = i
						for i < n && selector[i] != quote {
							i++
						}
						value = selector[start:i]
						if i < n {
							i++ // closing quote
						}
					} else {
						start = i
						for i < n && selector[i] != ']' {
							i++
						}
						value = selector[start:i]
					}
				}

				// skip until closing ]
				for i < n && selector[i] != ']' {
					i++
				}
				if i < n {
					i++
				}

				step.AttrKey = key
				step.AttrValue = value

			} else {
				break
			}
		}

		// detect combinator
		for i < n && selector[i] == ' ' {
			spaceBefore = true
			i++
		}

		if i < n {
			switch selector[i] {
			case '>':
				step.Combinator = ">"
				i++
			case '+':
				step.Combinator = "+"
				i++
			case '~':
				step.Combinator = "~"
				i++
			default:
				if spaceBefore {
					step.Combinator = " "
				}
			}
		}

		steps = append(steps, step)
	}
	return steps
}
