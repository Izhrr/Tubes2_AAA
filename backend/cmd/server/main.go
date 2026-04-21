package main

import (
	"github.com/gin-gonic/gin"
	"backend/internal/handler"
)

func main() {
	r := gin.Default()
	r.POST("/api/search", handler.HandleSearch)
	r.Run(":8080")
}