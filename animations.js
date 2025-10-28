/**
 * Wedding Website Animations
 * Handles scroll-triggered staggered animations for all pages
 */

(function() {
	'use strict';

	// Configuration
	const CONFIG = {
		threshold: 0.15,
		rootMargin: '0px',
		animationDelay: 100,
		scrollDebounce: 100
	};

	// State
	let isInitialized = false;
	let container = null;
	let sections = [];

	/**
	 * Initialize the animation system
	 */
	function init() {
		if (isInitialized) return;

		container = document.querySelector('.snap-container');
		sections = Array.from(document.querySelectorAll('section.snap-page'));

		if (!container || sections.length === 0) {
			console.warn('Animation system: container or sections not found');
			return;
		}

		// Use Intersection Observer for reliable visibility detection
		if ('IntersectionObserver' in window) {
			setupIntersectionObserver();
		} else {
			// Fallback for older browsers
			setupScrollFallback();
		}

		// Mark first section visible immediately
		setTimeout(() => {
			if (sections[0]) {
				sections[0].classList.add('is-visible');
			}
		}, 50);

		isInitialized = true;
	}

	/**
	 * Setup Intersection Observer (modern browsers)
	 */
	function setupIntersectionObserver() {
		const observerOptions = {
			root: null, // viewport
			threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0],
			rootMargin: '0px'
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				// Section is considered visible if at least 30% is in view
				if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
					// Remove and re-add to retrigger animations
					entry.target.classList.remove('is-visible');
					// Force reflow
					void entry.target.offsetWidth;
					entry.target.classList.add('is-visible');
				} else if (entry.intersectionRatio < 0.1) {
					// Remove when section leaves viewport so animation can retrigger
					entry.target.classList.remove('is-visible');
				}
			});
		}, observerOptions);

		sections.forEach(section => observer.observe(section));

		// Also listen to scroll for horizontal snap container
		let scrollTimer;
		container.addEventListener('scroll', () => {
			clearTimeout(scrollTimer);
			scrollTimer = setTimeout(() => {
				checkVisibleSection();
			}, CONFIG.scrollDebounce);
		}, { passive: true });

		// Touch end for mobile
		container.addEventListener('touchend', () => {
			setTimeout(checkVisibleSection, 200);
		}, { passive: true });
	}

	/**
	 * Fallback for browsers without Intersection Observer
	 */
	function setupScrollFallback() {
		let scrollTimer;
		
		const handleScroll = () => {
			clearTimeout(scrollTimer);
			scrollTimer = setTimeout(checkVisibleSection, CONFIG.scrollDebounce);
		};

		container.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll, { passive: true });
		
		// Check immediately
		checkVisibleSection();
	}

	/**
	 * Check which section is currently visible and mark it
	 */
	function checkVisibleSection() {
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const viewportCenter = containerRect.left + containerRect.width / 2;

		let closestSection = null;
		let minDistance = Infinity;

		sections.forEach(section => {
			const rect = section.getBoundingClientRect();
			const sectionCenter = rect.left + rect.width / 2;
			const distance = Math.abs(sectionCenter - viewportCenter);

			if (distance < minDistance) {
				minDistance = distance;
				closestSection = section;
			}
		});

		// Reset all sections first
		sections.forEach(section => {
			if (section !== closestSection) {
				section.classList.remove('is-visible');
			}
		});

		// Trigger animation on the closest section
		if (closestSection) {
			// Remove first to retrigger
			closestSection.classList.remove('is-visible');
			// Force reflow
			void closestSection.offsetWidth;
			// Add back to trigger animation
			closestSection.classList.add('is-visible');
		}
	}

	/**
	 * Initialize on DOM ready
	 */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Also try on window load as backup
	window.addEventListener('load', () => {
		setTimeout(init, 100);
		setTimeout(checkVisibleSection, 200);
	});

	// Expose for debugging
	window.__weddingAnimations = {
		init,
		checkVisibleSection,
		getState: () => ({
			isInitialized,
			sectionsCount: sections.length,
			visibleSections: sections.filter(s => s.classList.contains('is-visible')).length
		})
	};

})();

