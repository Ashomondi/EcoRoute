package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"ecoroute/backend/config"
	"ecoroute/backend/internal/utils"
)

type UploadHandler struct {
	dir string
	url string
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{dir: cfg.UploadDir, url: cfg.UploadURL}
}

func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "a 'file' field is required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedImageExt(ext) {
		utils.RespondError(w, http.StatusBadRequest, "unsupported file type")
		return
	}

	name := randomName() + ext
	dst, err := os.Create(filepath.Join(h.dir, name))
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	utils.RespondData(w, http.StatusCreated, map[string]string{"url": h.url + "/" + name})
}

func allowedImageExt(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return true
	default:
		return false
	}
}

func randomName() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "upload"
	}
	return hex.EncodeToString(b)
}
