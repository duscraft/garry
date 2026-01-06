FROM rust:1.92-alpine AS builder

RUN apk add --no-cache musl-dev curl

WORKDIR /app
COPY . .
RUN cargo build --release

FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /app/target/release/garry-api .

EXPOSE 8080

CMD ["./garry-api"]
