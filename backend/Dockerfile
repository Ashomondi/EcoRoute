FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server

FROM alpine:3.20
WORKDIR /app
RUN adduser -D -u 1000 ecoroute
COPY --from=build /out/server /app/server
RUN mkdir -p /app/uploads && chown -R ecoroute:ecoroute /app
USER ecoroute
EXPOSE 8080
CMD ["/app/server"]
