package model

type DOMNode struct {
	ID         string            `json:"id"`
	Tag        string            `json:"tag"`
	Attributes map[string]string `json:"attributes"`
	Children   []DOMNode         `json:"children"`
	Depth      int               `json:"depth"`
	ParentID   *string           `json:"parentId"`
}

type ScrapeRequest struct {
	URL  string `json:"url"`
	HTML string `json:"html"`
}

type ScrapeResponse struct {
	DOMTree   *DOMNode `json:"domTree"`
	NodeCount int      `json:"nodeCount"`
	MaxDepth  int      `json:"maxDepth"`
}