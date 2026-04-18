package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend/internal/model"
	"backend/internal/service"
)

func HandleScrape(c *gin.Context) {
	var req model.ScrapeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	result, err := service.ProcessScrape(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}