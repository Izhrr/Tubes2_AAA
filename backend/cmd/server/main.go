package main

import (
	"github.com/gin-gonic/gin"
	"backend/internal/handler"
)

func main() {
	r := gin.Default()
	r.POST("/api/scrape", handler.HandleScrape)
	r.Run(":8080")
}