/**
 * Blog functionality for wiesion.ch
 * Handles reading progress, Mermaid diagrams, and table of contents
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        mermaid: {
            theme: 'dark',
            themeVariables: {
                primaryColor: '#56cbf9',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#dbff76',
                lineColor: '#56cbf9',
                secondaryColor: 'rgba(86, 203, 249, 0.1)',
                tertiaryColor: 'rgba(219, 255, 118, 0.1)',
                background: '#000000',
                mainBkg: 'rgba(86, 203, 249, 0.1)',
                secondBkg: 'rgba(219, 255, 118, 0.1)',
                tertiaryBkg: '#000000'
            }
        },
        toc: {
            selectors: '.post-content h2, .post-content h3, .post-content h4',
            minHeadings: 2,
            containerId: 'toc-container'
        }
    };

    // Reading Progress Bar Module
    const ReadingProgress = {
        init() {
            this.progressBar = document.querySelector('.reading-progress');
            this.backToTopButton = document.querySelector('.back-to-top');
            this.siteHeader = document.querySelector('.site-header');

            if (!this.progressBar && !this.backToTopButton) return;

            this.bindEvents();
            this.update(); // Initial update
        },

        getHeaderHeight() {
            if (!this.siteHeader) return 0;
            return this.siteHeader.offsetHeight;
        },

        update() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const headerHeight = this.getHeaderHeight();

            // Maximum scrollable distance (when you reach the bottom)
            const maxScroll = documentHeight - windowHeight;

            // Show elements only when scrolled past header
            const pastHeader = scrollTop > headerHeight;

            // Progress calculation: 0% at top, 100% at bottom
            const scrollPercent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

            // Update progress bar
            if (this.progressBar) {
                if (pastHeader && maxScroll > 0) {
                    document.documentElement.style.setProperty('--progress-width', `${Math.min(100, scrollPercent)}%`);
                } else {
                    document.documentElement.style.setProperty('--progress-width', '0%');
                }
            }

            // Update back-to-top button
            if (this.backToTopButton) {
                if (pastHeader) {
                    this.backToTopButton.classList.add('visible');
                } else {
                    this.backToTopButton.classList.remove('visible');
                }
            }
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        bindEvents() {
            // Throttled scroll handler
            let ticking = false;
            const handleScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.update();
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', () => this.update(), { passive: true });

            if (this.backToTopButton) {
                this.backToTopButton.addEventListener('click', () => this.scrollToTop());
            }
        }
    };

    // Mermaid Diagrams Module
    const MermaidRenderer = {
        init() {
            if (typeof mermaid === 'undefined') return;

            mermaid.initialize({
                startOnLoad: false,
                ...CONFIG.mermaid
            });

            this.processCodeBlocks();
            this.renderDiagrams();
        },

        processCodeBlocks() {
            const selectors = [
                'pre code.language-mermaid',
                'pre.highlight code[data-lang="mermaid"]',
                'code.language-mermaid'
            ];

            const mermaidBlocks = document.querySelectorAll(selectors.join(', '));
            
            mermaidBlocks.forEach((block, index) => {
                const mermaidCode = block.textContent || block.innerText;
                const mermaidDiv = this.createMermaidElement(mermaidCode, index);
                
                const preElement = block.closest('pre') || block.parentElement;
                preElement.parentNode.insertBefore(mermaidDiv, preElement);
                preElement.remove();
            });
        },

        createMermaidElement(code, index) {
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = code;
            div.id = `mermaid-${index}`;
            return div;
        },

        renderDiagrams() {
            if (document.querySelectorAll('.mermaid').length > 0) {
                mermaid.run();
            }
        }
    };

    // Table of Contents Module
    const TableOfContents = {
        init() {
            this.container = document.getElementById(CONFIG.toc.containerId);
            if (!this.container) return;

            this.headings = document.querySelectorAll(CONFIG.toc.selectors);
            if (this.headings.length < CONFIG.toc.minHeadings) return;

            this.generate();
        },

        generate() {
            const wrapper = this.createWrapper();
            const header = this.createHeader();
            const list = this.createList();

            wrapper.appendChild(header);
            wrapper.appendChild(list);
            this.container.appendChild(wrapper);
            
            this.bindSmoothScrolling();
            this.bindToggle(wrapper, list);
        },

        createWrapper() {
            const wrapper = document.createElement('div');
            wrapper.className = 'toc-wrapper';
            return wrapper;
        },

        createHeader() {
            const header = document.createElement('div');
            header.className = 'toc-header';
            header.innerHTML = `
                <svg class="toc-icon" height="16" width="16" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M1 2h14v2H1V2zm0 3h14v2H1V5zm0 3h14v2H1V8zm0 3h14v2H1v-2z"/>
                </svg>
                <span>Table of Contents</span>
                <span class="toc-toggle" data-action="hide">[hide]</span>
            `;
            return header;
        },

        createList() {
            const list = document.createElement('ol');
            list.className = 'toc-list';

            // Always add "1. Intro" as the first item
            const introItem = this.createIntroListItem();
            list.appendChild(introItem);

            this.headings.forEach((heading, index) => {
                const id = this.generateHeadingId(heading, index);
                heading.id = id;

                const listItem = this.createListItem(heading, id);
                list.appendChild(listItem);
            });

            return list;
        },

        createIntroListItem() {
            const listItem = document.createElement('li');
            listItem.className = 'toc-intro';
            
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = 'Intro';
            link.className = 'toc-link';
            
            // Scroll to top of post content when clicked
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postContent = document.querySelector('.post-content');
                if (postContent) {
                    postContent.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            
            listItem.appendChild(link);
            return listItem;
        },

        createListItem(heading, id) {
            const listItem = document.createElement('li');
            listItem.className = `toc-${heading.tagName.toLowerCase()}`;
            
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = heading.textContent;
            link.className = 'toc-link';
            
            listItem.appendChild(link);
            return listItem;
        },

        generateHeadingId(heading, index) {
            const baseId = heading.textContent
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            return `toc-${index}-${baseId}`;
        },

        bindSmoothScrolling() {
            document.querySelectorAll('.toc-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').slice(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                });
            });
        },

        bindToggle(wrapper, list) {
            const toggle = wrapper.querySelector('.toc-toggle');
            if (!toggle) return;

            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = toggle.getAttribute('data-action') === 'show';
                
                if (isHidden) {
                    // Show the list
                    list.style.display = '';
                    toggle.textContent = '[hide]';
                    toggle.setAttribute('data-action', 'hide');
                    wrapper.classList.remove('toc-collapsed');
                } else {
                    // Hide the list
                    list.style.display = 'none';
                    toggle.textContent = '[show]';
                    toggle.setAttribute('data-action', 'show');
                    wrapper.classList.add('toc-collapsed');
                }
            });
        }
    };

    // Main Blog Module
    const Blog = {
        init() {
            this.initializeModules();
        },

        initializeModules() {
            // Initialize reading progress (runs immediately)
            ReadingProgress.init();
            
            // Initialize other modules when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    MermaidRenderer.init();
                    TableOfContents.init();
                });
            } else {
                MermaidRenderer.init();
                TableOfContents.init();
            }
        }
    };

    // Initialize the blog functionality
    Blog.init();

})();
