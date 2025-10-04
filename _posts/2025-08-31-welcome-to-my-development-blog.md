---
layout: blog
title: "Welcome to My Development Blog"
date: 2025-08-31 11:30:00 +0100
tags: [development, jekyll, docker]
excerpt: "Insights on software development, project experiences, and technical discoveries. Learn how this site was built and follow my engineering journey."
github_repo: "https://github.com/wiesion/wiesion.github.io"
github_description: "My freelance website and development blog, built with Jekyll"
---

Welcome to my development blog!

After years of working on various projects and helping businesses and development teams, I decided it was time to share some of the knowledge and experiences I've gathered along the way.

My journey in software development started in 1999 when I was 16 and convinced web applications were the future (despite my dad's attempts to steer me toward MS Access!).
I began with PHP, JavaScript, and MySQL, building everything from websites (framesets anyone?) to inventory management systems for local businesses.
Over the years, I evolved with the ecosystem - from vanilla JS to Prototype.js to jQuery, while simultaneously diving deep into database optimization: indexes, partitioning, window functions, stored procedures, and ETL processes. I've developed monoliths, APIs, and websites across ASP, ColdFusion, Ruby, Python, and various frameworks.

As frontend frameworks evolved toward increasingly complex architectures, my interests gravitated toward the infrastructure and data challenges critical for scaling applications.
The backend and DevOps space offers the systematic problem-solving that energizes me most.

I also spent several years as a part-time QA Manager at a fintech company, focusing on process optimization rather than test writing - ensuring stakeholders could write clear requirements, developers sticked to guidelines, and establishing workflows that caught issues before production.

## What You Can Expect

This blog will feature:

- **Technical insights** from real-world projects and experiments
- **Development best practices** I've learned over 20+ years
- **Case studies** from client projects (anonymized, of course)

## Recent Focus Areas

I've been particularly focused on:

- Modern web application architecture and infrastructure
- Database performance tuning
- Resource efficiency
- Container orchestration and optimization
- CI/CD pipeline improvements
- Redmine customization and plugin development

## How This Site Was Built

Since this is a development blog, I thought it would be fitting to share how this very site was created. This Jekyll-powered blog showcases one of my favorite approaches to modern web development: **containerized development environments**.

Rather than requiring a server-side CMS, my articles are written in Markdown with occasional [mermaid](https://mermaid.js.org/) diagrams, using a simple layout where [Jekyll](https://jekyllrb.com/) really shines. This approach also means I can host the site on GitHub Pages as static HTML, avoiding attack vectors and server maintenance overhead.

### The Docker Development Setup

One of the biggest productivity and quality boosts in modern web development is having a consistent, isolated development environment that works the same way across different machines and operating systems.

Let's take this Jekyll-based project, for instance: 10+ years ago, it was common to have RVM (or later rbenv) installed to handle multiple Ruby versions and environments, though rehashing and version maintenance were still inconvenient.

The main issues were that local OS dependencies could behave differently, and without matching RDBMS versions and configurations, development environments often deviated from production, making debugging time-consuming.

Fortunately, containerization became widespread, not only speeding up local development but also making it much more consistent.

### Key Components

- **Dockerfile Configuration**: Uses Ruby 3.3 on Debian slim with all necessary build tools, ensuring consistent environments across development and deployment.
- **Docker Compose**: Handles the development server with live reload, bundle caching for faster rebuilds, and proper port mapping for both Jekyll and LiveReload.
- **Bundle Caching**: A Docker volume persists gem installations, significantly speeding up subsequent builds.
- **Cross-Platform Compatibility**: Force polling ensures file watching works properly with Docker volumes on Windows and macOS.

### The Benefits

This approach eliminates environment setup headaches:
- No RVM or Ruby installation required
- No gem version conflicts
- Identical development environment for all machines I work on

### Development Workflow

Getting started is incredibly simple - just clone the repository and run `docker-compose up`. The site is immediately available at `http://localhost:4000` with live reload for instant feedback on changes.

## Stay Connected

I'll be posting about interesting discoveries, challenges solved, and tools that make development life easier. Many posts will include links to related GitHub repositories with code examples and implementations.

Feel free to reach out through any of the channels listed on the [home page](/) if you have questions about any of the topics I cover, or if you're facing similar challenges in your own projects.
