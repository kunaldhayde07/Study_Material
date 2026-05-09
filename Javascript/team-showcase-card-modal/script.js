/**
 * Team Members Showcase - JavaScript
 * Handles dynamic rendering and interactions
 */

// ========================================
// Team Member Data
// ========================================
const teamMembers = [
    {
        id: 1,
        name: 'Sarah Mitchell',
        role: 'Chief Executive Officer',
        description: 'Visionary leader with 15+ years of experience in tech innovation and business strategy.',
        bio: 'Sarah Mitchell is a seasoned entrepreneur and business leader who has been at the forefront of technological innovation for over 15 years. With a background in computer science and an MBA from Stanford, she has successfully led multiple startups from conception to acquisition. Sarah is passionate about building diverse teams and creating products that solve real-world problems. When she\'s not strategizing, you can find her mentoring young entrepreneurs or exploring new hiking trails.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
        skills: ['Strategic Planning', 'Business Development', 'Team Leadership', 'Product Vision', 'Investor Relations'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    },
    {
        id: 2,
        name: 'Marcus Chen',
        role: 'Chief Technology Officer',
        description: 'Technical architect driving innovation with expertise in scalable systems and cloud infrastructure.',
        bio: 'Marcus Chen brings over 12 years of experience in software architecture and engineering leadership. He has designed and implemented large-scale distributed systems serving millions of users. Marcus is a strong advocate for clean code, agile methodologies, and continuous learning. He regularly speaks at tech conferences and contributes to open-source projects. His expertise spans cloud computing, microservices, and artificial intelligence integration.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        skills: ['System Architecture', 'Cloud Infrastructure', 'Microservices', 'AI/ML Integration', 'Security'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    },
    {
        id: 3,
        name: 'Emily Rodriguez',
        role: 'Head of Design',
        description: 'Creative director crafting intuitive and beautiful user experiences that delight customers.',
        bio: 'Emily Rodriguez is an award-winning designer with a passion for creating user-centered digital experiences. With over 10 years in the industry, she has led design teams at top tech companies and startups. Emily believes that great design is invisible—it just works. She holds a degree in Interaction Design from RISD and is certified in UX research methodologies. Her work has been featured in major design publications, and she mentors aspiring designers through various programs.',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        skills: ['UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Design Leadership'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    },
    {
        id: 4,
        name: 'David Park',
        role: 'VP of Engineering',
        description: 'Engineering leader building high-performing teams and delivering exceptional software solutions.',
        bio: 'David Park has spent the last 14 years building and scaling engineering teams. He believes in empowering developers, fostering a culture of excellence, and delivering value through iterative development. David has expertise in full-stack development, DevOps practices, and agile transformation. He is passionate about technical mentorship and has helped numerous engineers advance their careers. In his free time, David enjoys building IoT projects and contributing to developer education initiatives.',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        skills: ['Engineering Management', 'Full-Stack Development', 'DevOps', 'Agile Methodologies', 'Mentorship'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    },
    {
        id: 5,
        name: 'Aisha Patel',
        role: 'Head of Marketing',
        description: 'Marketing strategist driving brand growth through data-driven campaigns and creative storytelling.',
        bio: 'Aisha Patel is a results-driven marketing executive with a proven track record of building brands and driving growth. With over 11 years of experience in digital marketing, she excels at creating integrated campaigns that resonate with target audiences. Aisha has expertise in content strategy, growth hacking, and marketing analytics. She has successfully launched products that generated millions in revenue and built communities of millions of engaged users. Aisha is a regular contributor to marketing blogs and speaks at industry events.',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
        skills: ['Brand Strategy', 'Digital Marketing', 'Content Strategy', 'Growth Marketing', 'Analytics'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    },
    {
        id: 6,
        name: 'James Wilson',
        role: 'Lead Developer',
        description: 'Senior developer crafting elegant code and building robust, scalable applications.',
        bio: 'James Wilson is a passionate software developer with 9 years of experience building web and mobile applications. He specializes in modern JavaScript frameworks and has a keen eye for performance optimization. James is committed to writing clean, maintainable code and follows best practices in software development. He actively participates in code reviews, tech talks, and open-source contributions. James believes in the power of collaboration and knowledge sharing within the developer community.',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
        skills: ['JavaScript', 'React', 'Node.js', 'Performance Optimization', 'API Design'],
        social: {
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
            github: 'https://github.com'
        }
    }
];

// ========================================
// DOM Elements
// ========================================
const teamGrid = document.getElementById('teamGrid');
const modalOverlay = document.getElementById('modalOverlay');
const modalContainer = document.getElementById('modalContainer');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

// ========================================
// SVG Icons
// ========================================
const socialIcons = {
    linkedin: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
        </svg>
    `,
    twitter: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
        </svg>
    `,
    github: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    `
};

// ========================================
// Render Functions
// ========================================
/**
 * Renders team member cards dynamically
 */
function renderTeamCards() {
    if (!teamGrid) return;

    teamGrid.innerHTML = teamMembers.map(member => `
        <article class="team-card" tabindex="0" data-member-id="${member.id}" aria-label="View ${member.name}'s profile">
            <div class="profile-image-container">
                <img 
                    src="${member.image}" 
                    alt="${member.name}" 
                    class="profile-image"
                    loading="lazy"
                >
            </div>
            <div class="member-info">
                <h3 class="member-name">${member.name}</h3>
                <p class="member-role">${member.role}</p>
                <p class="member-description">${member.description}</p>
            </div>
            <div class="social-icons">
                <a 
                    href="${member.social.linkedin}" 
                    class="social-icon" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="${member.name}'s LinkedIn"
                    onclick="event.stopPropagation()"
                >
                    ${socialIcons.linkedin}
                </a>
                <a 
                    href="${member.social.twitter}" 
                    class="social-icon" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="${member.name}'s Twitter"
                    onclick="event.stopPropagation()"
                >
                    ${socialIcons.twitter}
                </a>
                <a 
                    href="${member.social.github}" 
                    class="social-icon" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="${member.name}'s GitHub"
                    onclick="event.stopPropagation()"
                >
                    ${socialIcons.github}
                </a>
            </div>
        </article>
    `).join('');

    // Add event listeners to cards
    attachCardEventListeners();
}

/**
 * Renders modal content with member details
 * @param {Object} member - Team member object
 */
function renderModalContent(member) {
    if (!modalContent) return;

    modalContent.innerHTML = `
        <img 
            src="${member.image}" 
            alt="${member.name}" 
            class="modal-profile-image"
        >
        <h2 class="modal-member-name">${member.name}</h2>
        <p class="modal-member-role">${member.role}</p>
        <p class="modal-bio">${member.bio}</p>
        
        <div class="modal-skills">
            <h3 class="modal-skills-title">Skills & Expertise</h3>
            <div class="skills-list">
                ${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-social-links">
            <a 
                href="${member.social.linkedin}" 
                class="modal-social-icon" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="${member.name}'s LinkedIn"
            >
                ${socialIcons.linkedin}
            </a>
            <a 
                href="${member.social.twitter}" 
                class="modal-social-icon" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="${member.name}'s Twitter"
            >
                ${socialIcons.twitter}
            </a>
            <a 
                href="${member.social.github}" 
                class="modal-social-icon" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="${member.name}'s GitHub"
            >
                ${socialIcons.github}
            </a>
        </div>
    `;
}

// ========================================
// Event Handlers
// ========================================
/**
 * Attaches click and keyboard event listeners to team cards
 */
function attachCardEventListeners() {
    const cards = teamGrid.querySelectorAll('.team-card');
    
    cards.forEach(card => {
        // Click event
        card.addEventListener('click', () => {
            const memberId = parseInt(card.dataset.memberId, 10);
            openModal(memberId);
        });

        // Keyboard event (Enter or Space)
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const memberId = parseInt(card.dataset.memberId, 10);
                openModal(memberId);
            }
        });
    });
}

/**
 * Opens the modal with member details
 * @param {number} memberId - ID of the member to display
 */
function openModal(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    renderModalContent(member);
    
    // Add active class to show modal
    modalOverlay.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus trap - focus the close button
    modalClose.focus();
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Closes the modal
 */
function closeModal() {
    modalOverlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Clear modal content after animation
    setTimeout(() => {
        modalContent.innerHTML = '';
    }, 300);
}

/**
 * Handles escape key press to close modal
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

/**
 * Handles click outside modal to close
 * @param {MouseEvent} event - Mouse event
 */
function handleOverlayClick(event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
}

// ========================================
// Initialize
// ========================================
function initialize() {
    // Render team cards
    renderTeamCards();
    
    // Close button event
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Overlay click event
    if (modalOverlay) {
        modalOverlay.addEventListener('click', handleOverlayClick);
    }
    
    // Handle window resize for any responsive adjustments
    window.addEventListener('resize', debounce(() => {
        // Re-render if needed for responsive adjustments
    }, 250));
}

/**
 * Debounce utility function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// DOM Ready
// ========================================
document.addEventListener('DOMContentLoaded', initialize);

// Also initialize if DOM is already ready
if (document.readyState !== 'loading') {
    initialize();
}
