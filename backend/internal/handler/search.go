package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend/internal/model"
	"backend/internal/service"
)

func HandleSearch(c *gin.Context) {
	var req model.SearchRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	result, err := service.ProcessSearch(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}