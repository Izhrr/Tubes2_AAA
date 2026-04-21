package model

type DOMNode struct {
	ID         string            `json:"id"`
	Tag        string            `json:"tag"`
	Attributes map[string]string `json:"attributes"`
	Children   []*DOMNode        `json:"children"`
	Depth      int               `json:"depth"`
	Parent     *DOMNode          `json:"-"`
}

type Step struct {
	Tag        string
	Classes    []string
	ID         string
	AttrKey    string
	AttrValue  string
	Combinator string
}

type SearchRequest struct {
	URL         string `json:"url"`
	HTML        string `json:"html"`
	Algorithm   string `json:"algorithm"`
	CSSSelector string `json:"cssSelector"`
	MaxResults  int    `json:"maxResults"`
}

type TraversalStep struct {
	NodeID  string `json:"nodeId"`
	Tag     string `json:"tag"`
	Matched bool   `json:"matched"`
}

type SearchResponse struct {
	DOMTree      *DOMNode        `json:"domTree"`
	NodeCount    int             `json:"nodeCount"`
	MaxDepth     int             `json:"maxDepth"`
	ExecutionMs  int64           `json:"executionMs"`
	NodesVisited int             `json:"nodesVisited"`
	Results      []*DOMNode      `json:"results"`
	TraversalLog []TraversalStep `json:"traversalLog"`
}
