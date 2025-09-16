# wiesion.ch - Freelance IT Services Website

A Jekyll-based website for my freelance IT services, featuring a professional landing page and development blog.

## Features

- **Landing Page**: Showcasing services, expertise, and contact information
- **Development Blog**: Articles about software development with GitHub repository integration
- **Responsive Design**: Mobile-first approach with clean, professional styling
- **Docker Development Environment**: Complete isolation without local Ruby installation

## Local Development

### Prerequisites

- Docker
- Docker Compose

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/wiesion/wiesion.github.io.git
   cd wiesion.github.io
   ```

2. Start the development server:
   ```bash
   # On Windows
   dev.bat
   
   # On macOS/Linux
   ./dev.sh
   ```

3. Open your browser to [http://localhost:4000](http://localhost:4000)

The site will automatically reload when you make changes to files.

### Manual Docker Commands

If you prefer to run Docker commands manually:

```bash
# Build and start the development server
docker-compose up --build

# Stop the server
docker-compose down

# Rebuild from scratch (if needed)
docker-compose down --volumes
docker-compose up --build
```

## Creating Blog Posts

1. Create a new file in `_posts/` with the format: `YYYY-MM-DD-title.md`

2. Add front matter at the top:
   ```yaml
   ---
   layout: post
   title: "Your Post Title"
   date: 2024-12-01 10:00:00 +0100
   tags: [tag1, tag2, tag3]
   excerpt: "Brief description of your post"
   github_repo: "https://github.com/username/repository" # Optional
   github_description: "Description of the linked repository" # Optional
   ---
   ```

3. Write your content using Markdown

## GitHub Repository Integration

Posts can include special callout boxes for related GitHub repositories by adding these fields to the front matter:

- `github_repo`: URL to the GitHub repository
- `github_description`: Brief description of what the repository contains

This will automatically render a styled callout box in the post.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `gh-pages` branch.

## Project Structure

```
├── _config.yml          # Jekyll configuration
├── _layouts/            # Page layouts
│   ├── default.html     # Base layout
│   ├── home.html        # Landing page layout
│   └── post.html        # Blog post layout
├── _posts/              # Blog posts
├── blog/                # Blog listing page
├── assets/              # Static assets (fonts, images, etc.)
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── README.md           # This file
```

## Technologies Used

- Jekyll 4.4
- Ruby 3.3
- Docker & Docker Compose
- GitHub Pages
- HTML5, CSS3, JavaScript
