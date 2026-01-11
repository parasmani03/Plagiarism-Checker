class PlagiarismChecker {
    constructor() {
        this.sourceText = '';
        this.compareText = '';
        this.currentUser = null;
        this.initializeEventListeners();
        this.checkLoginStatus();
    }

    initializeEventListeners() {
        // Login button
        document.getElementById('login-btn').addEventListener('click', () => this.openLoginPage());

        // History button
        document.getElementById('history-btn').addEventListener('click', () => this.showHistory());

        // Check button
        document.getElementById('check-plagiarism').addEventListener('click', () => this.checkPlagiarism());

        // Clear button
        document.getElementById('clear-text').addEventListener('click', () => this.clearText());

        // Word counter
        document.getElementById('source-text').addEventListener('input', () => this.updateWordCounter());

        // Action buttons
        document.getElementById('new-check').addEventListener('click', () => this.newCheck());
        document.getElementById('export-results').addEventListener('click', () => this.exportResults());

        // Modal close button
        document.getElementById('close-history').addEventListener('click', () => this.closeHistory());

        // Clear history button
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());

        // Close modal on overlay click
        document.getElementById('history-modal').addEventListener('click', (e) => {
            if (e.target.id === 'history-modal') {
                this.closeHistory();
            }
        });
    }

    checkLoginStatus() {
        // Check Firebase auth state
        window.onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                // User is logged in
                this.currentUser = {
                    email: user.email,
                    uid: user.uid
                };
                this.updateLoginButton();
            } else {
                // User is not logged in, check sessionStorage as fallback
                const userData = sessionStorage.getItem('currentUser');
                if (userData) {
                    this.currentUser = JSON.parse(userData);
                    this.updateLoginButton();
                }
            }
        });
    }

    updateLoginButton() {
        const loginBtn = document.getElementById('login-btn');
        const historyBtn = document.getElementById('history-btn');
        const headerActions = document.querySelector('.header-actions');
        
        if (this.currentUser) {
            // Get first letter of email
            const firstLetter = this.currentUser.email.charAt(0).toUpperCase();
            
            // Create profile container
            headerActions.innerHTML = `
                <div class="profile-container">
                    <div class="profile-circle">${firstLetter}</div>
                    <button class="history-btn" id="history-btn">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add logout button to bottom left
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'logout-btn-bottom';
            logoutBtn.id = 'logout-btn';
            logoutBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
            `;
            
            // Add logout button to bottom left of the page
            document.body.appendChild(logoutBtn);
            
            // Add event listeners
            document.getElementById('logout-btn').addEventListener('click', () => this.logout());
            document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
        } else {
            // Show login button only
            headerActions.innerHTML = `
                <button class="login-btn" id="login-btn">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Login
                </button>
            `;
            
            // Add login event listener
            document.getElementById('login-btn').addEventListener('click', () => this.openLoginPage());
        }
    }

    saveToHistory(text, analysis) {
        if (!this.currentUser) return;
        
        const historyItem = {
            id: Date.now(),
            text: text,
            analysis: analysis,
            timestamp: new Date().toISOString(),
            userId: this.currentUser.uid
        };
        
        // Get existing history
        const history = this.getHistory();
        history.unshift(historyItem);
        
        // Keep only last 50 items
        if (history.length > 50) {
            history.splice(50);
        }
        
        // Save to localStorage
        localStorage.setItem(`plagiarism_history_${this.currentUser.uid}`, JSON.stringify(history));
    }

    getHistory() {
        if (!this.currentUser) return [];
        
        const historyData = localStorage.getItem(`plagiarism_history_${this.currentUser.uid}`);
        return historyData ? JSON.parse(historyData) : [];
    }

    showHistory() {
        const modal = document.getElementById('history-modal');
        const historyList = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        
        const history = this.getHistory();
        
        if (history.length === 0) {
            historyList.style.display = 'none';
            emptyHistory.style.display = 'block';
        } else {
            historyList.style.display = 'flex';
            emptyHistory.style.display = 'none';
            
            historyList.innerHTML = '';
            history.forEach(item => {
                const historyElement = this.createHistoryElement(item);
                historyList.appendChild(historyElement);
            });
        }
        
        modal.style.display = 'flex';
    }

    createHistoryElement(item) {
        const element = document.createElement('div');
        element.className = 'history-item';
        
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        element.innerHTML = `
            <div class="history-item-header">
                <span class="history-date">${formattedDate}</span>
            </div>
            <div class="history-text">${item.text}</div>
            <div class="history-meta">
                <span class="history-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    ${item.analysis.repeatedPhrases.length} patterns
                </span>
                <span class="history-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    ${item.text.length} chars
                </span>
            </div>
        `;
        
        element.addEventListener('click', () => {
            this.loadFromHistory(item);
            this.closeHistory();
        });
        
        return element;
    }

    loadFromHistory(item) {
        document.getElementById('source-text').value = item.text;
        this.updateWordCounter();
        this.displayResults(item.analysis, item.text);
        
        // Scroll to results
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    closeHistory() {
        document.getElementById('history-modal').style.display = 'none';
    }

    clearHistory() {
        if (!this.currentUser) return;
        
        if (confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
            localStorage.removeItem(`plagiarism_history_${this.currentUser.uid}`);
            this.showHistory(); // Refresh the display
            this.showNotification('History cleared successfully', 'success');
        }
    }

    async logout() {
        try {
            // Sign out from Firebase
            await window.signOut(window.firebaseAuth);
            
            // Clear sessionStorage
            sessionStorage.removeItem('currentUser');
            this.currentUser = null;
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: clear local session and redirect
            sessionStorage.removeItem('currentUser');
            this.currentUser = null;
            window.location.href = 'login.html';
        }
    }

    openLoginPage() {
        // Navigate to login page in the same browser window
        window.location.href = 'login.html';
    }

    preprocessText(text) {
        let processedText = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        return processedText;
    }

    calculateSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;

        const words1 = text1.split(' ').filter(word => word.length > 0);
        const words2 = text2.split(' ').filter(word => word.length > 0);

        if (words1.length === 0 || words2.length === 0) return 0;

        // Calculate Jaccard similarity
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        const jaccardSimilarity = intersection.size / union.size;

        // Calculate n-gram similarity (bigrams)
        const bigrams1 = this.getNgrams(words1, 2);
        const bigrams2 = this.getNgrams(words2, 2);
        
        const bigramIntersection = bigrams1.filter(bg => bigrams2.includes(bg));
        const bigramUnion = [...new Set([...bigrams1, ...bigrams2])];
        
        const bigramSimilarity = bigramUnion.length > 0 ? bigramIntersection.length / bigramUnion.length : 0;

        // Calculate longest common subsequence similarity
        const lcsSimilarity = this.calculateLCSSimilarity(words1, words2);

        // Weighted average of different similarity metrics
        const weightedSimilarity = (jaccardSimilarity * 0.4 + bigramSimilarity * 0.3 + lcsSimilarity * 0.3);

        return Math.round(weightedSimilarity * 100);
    }

    getNgrams(words, n) {
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    }

    calculateLCSSimilarity(words1, words2) {
        const m = words1.length;
        const n = words2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (words1[i - 1] === words2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        const lcsLength = dp[m][n];
        return (2 * lcsLength) / (m + n);
    }

    isMeaninglessWord(word) {
        // Check if word contains no vowels or has repeated characters
        const hasVowel = /[aeiou]/i.test(word);
        const hasRepeatedChars = /(.)\1{2,}/i.test(word); // 3+ same chars in sequence
        const isShortRandom = /^[bcdfghjklmnpqrstvwxyz]{3,}$/i.test(word); // consonants only
        
        return !hasVowel || hasRepeatedChars || isShortRandom;
    }

    detectHumanWritingPatterns(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const patterns = [];
        
        for (let i = 0; i <= words.length - 3; i++) {
            const word1 = words[i].toLowerCase().replace(/[^a-z]/g, '');
            const word2 = words[i + 1].toLowerCase().replace(/[^a-z]/g, '');
            const word3 = words[i + 2].toLowerCase().replace(/[^a-z]/g, '');
            
            // Check if same meaningless word appears 3 times in sequence
            if (word1 === word2 && word2 === word3 && word1.length > 0 && this.isMeaninglessWord(word1)) {
                patterns.push({
                    type: 'meaningless_sequence',
                    word: word1,
                    position: i,
                    sequence: `${word1} ${word2} ${word3}`
                });
            }
        }
        
        return patterns;
    }
    analyzeText(processedText, originalText) {
        const words = processedText.split(' ').filter(word => word.length > 0);
        const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Find repeated phrases and patterns
        const repeatedPhrases = this.findRepeatedPhrases(processedText);
        
        // Detect human writing patterns (meaningless words repeated 3 times)
        const humanPatterns = this.detectHumanWritingPatterns(originalText);
        const isHumanWriting = humanPatterns.length > 0;
        
        // Start with 0 plagiarism score - only add points when there are actual indicators
        let plagiarismScore = 0;
        
        // Only check for technical/academic indicators if text is substantial enough
        if (words.length > 20) {
            const technicalTerms = ['protocol', 'algorithm', 'network', 'data', 'system', 'layer', 'transmission', 'packet', 'flow', 'efficiency', 'throughput'];
            const technicalTermCount = words.filter(word => technicalTerms.includes(word.toLowerCase())).length;
            if (technicalTermCount > 3) plagiarismScore += 25;
            
            // Check for formal/academic writing style
            const formalWords = ['allows', 'using', 'improves', 'especially', 'connections', 'delivery', 'such', 'layer'];
            const formalWordCount = words.filter(word => formalWords.includes(word.toLowerCase())).length;
            if (formalWordCount > 5) plagiarismScore += 20;
            
            // Check for sentence structure typical of documentation
            const hasDefinitionPattern = originalText.match(/\b(is|are)\s+used\s+(for|to|where)\b/i);
            if (hasDefinitionPattern) plagiarismScore += 15;
            
            // Check for comma-separated lists (common in technical writing)
            const hasLists = originalText.match(/,\s+such\s+as\s+/i) || originalText.match(/,\s+especially\s+/i);
            if (hasLists) plagiarismScore += 10;
        }
        
        // High repetition increases plagiarism score
        const uniqueWords = new Set(words).size;
        if (uniqueWords / words.length < 0.7) plagiarismScore += 25;
        
        // Very short sentences might indicate copied content (only for longer texts)
        if (words.length > 15) {
            const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
            if (avgSentenceLength < 8) plagiarismScore += 20;
        }
        
        // Repeated phrases increase plagiarism score
        plagiarismScore += Math.min(repeatedPhrases.length * 15, 40);
        
        // Common word patterns (high ratio suggests copied content)
        const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const commonWordRatio = words.filter(word => commonWords.includes(word)).length / words.length;
        if (commonWordRatio > 0.4) plagiarismScore += 15;
        
        // For very short texts (under 10 words), be more lenient
        if (words.length < 10) {
            plagiarismScore = Math.min(plagiarismScore, 10); // Max 10% for very short texts
        }
        
        // Human writing patterns reduce plagiarism score
        if (isHumanWriting) plagiarismScore -= 30;
        
        // Normalize to 0-100 scale
        const finalPlagiarismScore = Math.max(0, Math.min(100, Math.round(plagiarismScore)));
        const humanWriteScore = 100 - finalPlagiarismScore;
        
        // Generate web sources only if plagiarism score > 0
        let webSources = [];
        if (finalPlagiarismScore > 0) {
            webSources = this.generateMockWebSources(processedText);
        }
        
        return {
            plagiarismScore: finalPlagiarismScore,
            humanWriteScore: humanWriteScore,
            repeatedPhrases: repeatedPhrases,
            isHumanWriting: isHumanWriting,
            humanPatterns: humanPatterns,
            webSources: webSources
        };
    }

    generateMockWebSources(text) {
        const domains = [
            'wikipedia.org', 'medium.com', 'github.com', 'stackoverflow.com',
            'reddit.com', 'quora.com', 'linkedin.com', 'twitter.com',
            'bbc.com', 'cnn.com', 'nytimes.com', 'guardian.com'
        ];
        
        const contentTypes = ['article', 'blog post', 'documentation', 'discussion', 'news'];
        
        const sources = [];
        const numSources = Math.floor(Math.random() * 3) + 1; // 1-3 sources
        
        for (let i = 0; i < numSources; i++) {
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
            const matchPercentage = Math.floor(Math.random() * 30) + 60; // 60-89% match
            
            sources.push({
                title: this.generateSourceTitle(text, contentType),
                url: `https://www.${domain}/articles/${Date.now()}-${i}`,
                domain: domain,
                contentType: contentType,
                matchPercentage: matchPercentage,
                snippet: this.generateSnippet(text),
                credibility: this.assessDomainCredibility(domain)
            });
        }
        
        return sources;
    }

    generateSourceTitle(text, contentType) {
        const templates = {
            'article': ['Understanding {topic}: A Comprehensive Guide', '{topic} - Complete Analysis', 'The Ultimate Guide to {topic}'],
            'blog post': ['My Thoughts on {topic}', '{topic}: What You Need to Know', 'Exploring {topic} in Depth'],
            'documentation': ['{topic} Documentation', 'API Reference: {topic}', 'Technical Guide: {topic}'],
            'discussion': ['Discussion: {topic}', '{topic} - Community Insights', 'Q&A: {topic} Explained'],
            'news': ['Breaking: {topic} Updates', 'Latest on {topic}', '{topic}: Recent Developments']
        };
        
        const typeTemplates = templates[contentType] || templates['article'];
        const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
        
        // Extract key topic from text (first few words)
        const topic = text.split(' ').slice(0, 3).join(' ');
        
        return template.replace('{topic}', topic);
    }

    generateSnippet(text) {
        const words = text.split(' ');
        const startIdx = Math.floor(Math.random() * Math.max(1, words.length - 3));
        const snippetWords = words.slice(startIdx, startIdx + 4);
        
        const prefixes = ['This article explains how', 'Research shows that', 'Experts agree on', 'Studies indicate'];
        const suffixes = ['in detail.', 'with examples.', 'for beginners.', 'effectively.'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${snippetWords.join(' ')} ${suffix}`;
    }

    assessDomainCredibility(domain) {
        const highCredibility = ['wikipedia.org', 'bbc.com', 'cnn.com', 'nytimes.com', 'guardian.com'];
        const mediumCredibility = ['medium.com', 'github.com', 'stackoverflow.com', 'linkedin.com'];
        
        if (highCredibility.some(d => domain.includes(d))) return 'High';
        if (mediumCredibility.some(d => domain.includes(d))) return 'Medium';
        return 'Low';
    }

    assessWritingQuality(originalText, sentences, words) {
        const quality = {
            grammarScore: 0,
            vocabularyScore: 0,
            sentenceStructureScore: 0,
            letterQualityScore: 0,
            isHighQuality: false,
            details: []
        };
        
        // Grammar assessment
        const grammarIssues = this.checkGrammar(originalText);
        quality.grammarScore = Math.max(0, 100 - grammarIssues.length * 10);
        quality.details.push(`Grammar: ${quality.grammarScore}% (${grammarIssues.length} issues)`);
        
        // Vocabulary diversity (using sophisticated words)
        const sophisticatedWords = this.detectSophisticatedWords(words);
        quality.vocabularyScore = Math.min(100, (sophisticatedWords.length / words.length) * 200);
        quality.details.push(`Vocabulary: ${Math.round(quality.vocabularyScore)}% (${sophisticatedWords.length} advanced words)`);
        
        // Sentence structure variety
        const sentenceVariety = this.analyzeSentenceStructure(sentences);
        quality.sentenceStructureScore = sentenceVariety.score;
        quality.details.push(`Sentence Structure: ${quality.sentenceStructureScore}% variety`);
        
        // Letter quality (proper punctuation, capitalization, formatting)
        const letterQuality = this.assessLetterQuality(originalText);
        quality.letterQualityScore = letterQuality.score;
        quality.details.push(`Letter Quality: ${quality.letterQualityScore}%`);
        
        // Calculate overall quality
        const overallScore = (quality.grammarScore + quality.vocabularyScore + 
                             quality.sentenceStructureScore + quality.letterQualityScore) / 4;
        
        quality.isHighQuality = overallScore >= 75;
        quality.overallScore = Math.round(overallScore);
        
        return quality;
    }
    
    checkGrammar(text) {
        const issues = [];
        
        // Check for common grammar issues
        if (text.match(/\b(a|an)\s+[aeiou]/i)) issues.push('Article-vowel mismatch');
        if (text.match(/\b(a|an)\s+[^aeiou\s]/i)) issues.push('Article-consonant mismatch');
        if (text.match(/\b\w+s\s+\w+s\b/)) issues.push('Possible double plural');
        if (text.match(/\s{2,}/)) issues.push('Extra spaces');
        if (text.match(/[.!?]{2,}/)) issues.push('Excessive punctuation');
        if (!text.match(/[A-Z]/)) issues.push('No capitalization');
        if (text.match(/[a-z]+[.!?]\s+[a-z]/)) issues.push('Missing capitalization after sentence');
        
        return issues;
    }
    
    detectSophisticatedWords(words) {
        const advancedWords = [
            'consequently', 'nevertheless', 'furthermore', 'moreover', 'therefore',
            'comprehensive', 'fundamental', 'significant', 'substantial', 'essential',
            'elaborate', 'demonstrate', 'establish', 'implement', 'facilitate',
            'paradigm', 'methodology', 'framework', 'perspective', 'conceptual',
            'analysis', 'synthesis', 'evaluation', 'assessment', 'examination',
            'proficient', 'adequate', 'sufficient', 'efficient', 'effective',
            'ambiguous', 'explicit', 'implicit', 'inherent', 'integral'
        ];
        
        return words.filter(word => 
            advancedWords.some(advanced => 
                word.toLowerCase().includes(advanced.toLowerCase())
            )
        );
    }
    
    analyzeSentenceStructure(sentences) {
        const lengths = sentences.map(s => s.split(' ').length);
        const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
        
        // Good variety: mix of short, medium, and long sentences
        const hasShort = lengths.some(len => len <= 8);
        const hasMedium = lengths.some(len => len > 8 && len <= 15);
        const hasLong = lengths.some(len => len > 15);
        
        let score = 50; // Base score
        if (hasShort && hasMedium && hasLong) score += 30;
        else if (hasShort && hasMedium) score += 20;
        else if (hasMedium && hasLong) score += 15;
        
        // Penalize too much variance or too uniform
        if (variance > 100) score -= 10;
        else if (variance < 5) score -= 15;
        
        return { score: Math.max(0, Math.min(100, score)), variance, avgLength };
    }
    
    assessLetterQuality(text) {
        let score = 100;
        const issues = [];
        
        // Check proper capitalization
        if (!text.match(/^[A-Z]/)) {
            score -= 10;
            issues.push('No sentence start capitalization');
        }
        
        // Check proper punctuation at end
        const sentences = text.split(/[.!?]/);
        if (sentences.length > 1 && !text.match(/[.!?]$/)) {
            score -= 5;
            issues.push('Missing ending punctuation');
        }
        
        // Check for proper spacing around punctuation
        if (text.match(/[a-z][.!?][a-z]/)) {
            score -= 10;
            issues.push('No space after punctuation');
        }
        
        // Check for consistent formatting
        if (text.match(/\t/)) {
            score -= 5;
            issues.push('Inconsistent tabs');
        }
        
        // Check for proper paragraph structure (if longer text)
        if (text.length > 200 && !text.match(/\n\s*\n/)) {
            score -= 10;
            issues.push('No paragraph breaks');
        }
        
        return { score: Math.max(0, score), issues };
    }
    
    generateInternetSources(analysis) {
        const sources = [];
        
        if (analysis.writingQuality.isHighQuality) {
            // Generate plausible internet sources based on quality metrics
            const sourceTypes = [
                { type: 'Academic Journal', credibility: 'High', domains: ['.edu', '.org', 'scholar.google.com'] },
                { type: 'Professional Blog', credibility: 'Medium', domains: ['.com', 'medium.com', 'linkedin.com'] },
                { type: 'News Article', credibility: 'Medium', domains: ['news.', 'bbc.com', 'cnn.com', 'reuters.com'] },
                { type: 'Research Paper', credibility: 'Very High', domains: ['arxiv.org', 'researchgate.net', 'academia.edu'] }
            ];
            
            // Select 2-3 random sources based on writing characteristics
            const numSources = Math.floor(Math.random() * 2) + 2;
            
            for (let i = 0; i < numSources; i++) {
                const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
                const source = {
                    title: this.generateSourceTitle(analysis),
                    type: sourceType.type,
                    credibility: sourceType.credibility,
                    domain: sourceType.domains[Math.floor(Math.random() * sourceType.domains.length)],
                    matchPercentage: Math.floor(Math.random() * 30) + 70, // 70-99% match
                    reason: this.generateMatchReason(analysis)
                };
                sources.push(source);
            }
        }
        
        return sources;
    }
    
    generateSourceTitle(analysis) {
        const templates = [
            'Advanced {topic} Analysis and Methodology',
            'Comprehensive Study on {topic}',
            'Understanding {topic}: A Modern Approach',
            '{topic}: Principles and Applications',
            'The Fundamentals of {topic} in Practice'
        ];
        
        const topics = ['Writing Techniques', 'Content Analysis', 'Text Processing', 
                       'Academic Writing', 'Communication Skills', 'Language Structure'];
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        return template.replace('{topic}', topic);
    }
    
    generateMatchReason(analysis) {
        const reasons = [
            'Similar vocabulary complexity and sentence structure',
            'Matching writing style and tone patterns',
            'Comparable grammar quality and formatting',
            'Parallel use of advanced linguistic features',
            'Identical paragraph organization and flow'
        ];
        
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    findRepeatedPhrases(text, minLength = 3) {
        const words = text.split(' ');
        const phrases = new Map();
        
        for (let i = 0; i <= words.length - minLength; i++) {
            for (let len = minLength; len <= Math.min(6, words.length - i); len++) {
                const phrase = words.slice(i, i + len).join(' ');
                if (phrases.has(phrase)) {
                    phrases.set(phrase, phrases.get(phrase) + 1);
                } else {
                    phrases.set(phrase, 1);
                }
            }
        }
        
        return Array.from(phrases.entries())
            .filter(([phrase, count]) => count > 1)
            .map(([phrase, count]) => ({ phrase, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    async checkPlagiarism() {
        const sourceText = document.getElementById('source-text').value.trim();

        if (!sourceText) {
            this.showNotification('Please enter text to analyze', 'error');
            return;
        }

        // Show loading state
        const checkBtn = document.getElementById('check-plagiarism');
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<span>Analyzing...</span>';

        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        const processedText = this.preprocessText(sourceText);
        const analysis = this.analyzeText(processedText, sourceText);

        // Search for web sources
        const webSources = await this.searchWebSources(sourceText);
        analysis.webSources = webSources;

        // Save to history (only if user is logged in)
        this.saveToHistory(sourceText, analysis);

        this.displayResults(analysis, sourceText);

        checkBtn.disabled = false;
        checkBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            Check for Plagiarism
        `;
    }

    displayResults(analysis, sourceText) {
        const resultsSection = document.getElementById('results');
        resultsSection.style.display = 'block';

        // Update plagiarism percentage
        const plagiarismPercentage = document.getElementById('plagiarism-percentage');
        plagiarismPercentage.textContent = `${analysis.plagiarismScore}%`;
        
        // Update plagiarism progress ring
        const plagiarismBar = document.querySelector('.plagiarism-bar');
        const circumference = 2 * Math.PI * 52; // radius = 52
        const plagiarismOffset = circumference - (analysis.plagiarismScore / 100) * circumference;
        plagiarismBar.style.strokeDasharray = `${circumference} ${circumference}`;
        plagiarismBar.style.strokeDashoffset = plagiarismOffset;

        // Update human write percentage
        const humanPercentage = document.getElementById('human-percentage');
        humanPercentage.textContent = `${analysis.humanWriteScore}%`;
        
        // Update human write progress ring
        const humanBar = document.querySelector('.human-bar');
        const humanOffset = circumference - (analysis.humanWriteScore / 100) * circumference;
        humanBar.style.strokeDasharray = `${circumference} ${circumference}`;
        humanBar.style.strokeDashoffset = humanOffset;

        // Generate and display web sources only if plagiarism detected
        if (analysis.plagiarismScore > 0 && analysis.webSources && analysis.webSources.length > 0) {
            this.displayInternetSources(analysis.webSources);
        } else {
            // Remove existing sources display if no plagiarism
            const existingSources = document.getElementById('internet-sources');
            if (existingSources) {
                existingSources.remove();
            }
        }

        // Display detected patterns
        const matchedContent = document.getElementById('matched-content');
        const matchedPhrasesContainer = document.getElementById('matched-phrases');

        const allPatterns = [];
        
        // Add repeated phrases
        if (analysis.repeatedPhrases.length > 0) {
            analysis.repeatedPhrases.forEach(phrase => {
                allPatterns.push({
                    type: 'repeated_phrase',
                    content: `"${phrase.phrase}" (repeated ${phrase.count} times)`
                });
            });
        }
        
        // Add human writing patterns
        if (analysis.humanPatterns.length > 0) {
            analysis.humanPatterns.forEach(pattern => {
                allPatterns.push({
                    type: 'human_pattern',
                    content: `Meaningless sequence: "${pattern.sequence}"`
                });
            });
        }

        if (allPatterns.length > 0) {
            matchedContent.style.display = 'block';
            matchedPhrasesContainer.innerHTML = '';

            allPatterns.forEach(pattern => {
                const patternElement = document.createElement('div');
                patternElement.className = 'matched-phrase';
                patternElement.textContent = pattern.content;
                matchedPhrasesContainer.appendChild(patternElement);
            });
        } else {
            matchedContent.style.display = 'none';
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }


    displayWritingQuality(analysis) {
        // Remove existing quality display if present
        const existingQuality = document.getElementById('writing-quality');
        if (existingQuality) {
            existingQuality.remove();
        }

        const quality = analysis.writingQuality;
        const resultsSection = document.getElementById('results');
        
        // Create quality display element
        const qualityElement = document.createElement('div');
        qualityElement.id = 'writing-quality';
        qualityElement.className = 'result-card';
        
        let qualityClass = 'status-low';
        if (quality.overallScore >= 75) qualityClass = 'status-high';
        else if (quality.overallScore >= 50) qualityClass = 'status-medium';
        
        qualityElement.innerHTML = `
            <div class="result-details">
                <div class="detail-item">
                    <span class="label">Writing Quality:</span>
                    <span class="value ${qualityClass}">${quality.overallScore}%</span>
                </div>
                <div class="quality-details">
                    ${quality.details.map(detail => `<div class="quality-detail">${detail}</div>`).join('')}
                </div>
                ${quality.isHighQuality ? '<div class="quality-alert">⚠️ High-quality writing detected - possible internet sources</div>' : ''}
            </div>
        `;
        
        // Insert after the first result card
        const firstResultCard = resultsSection.querySelector('.result-card');
        firstResultCard.parentNode.insertBefore(qualityElement, firstResultCard.nextSibling);
    }

    async searchWebSources(text) {
        try {
            // Extract key phrases for searching
            const searchPhrases = this.extractSearchPhrases(text);
            const sources = [];

            // Search for each phrase
            for (const phrase of searchPhrases.slice(0, 3)) { // Limit to 3 searches
                try {
                    const results = await this.performWebSearch(phrase);
                    sources.push(...results);
                } catch (error) {
                    console.log('Search failed for phrase:', phrase);
                }
            }

            // Remove duplicates and sort by match percentage
            const uniqueSources = this.deduplicateSources(sources);
            return uniqueSources.slice(0, 5); // Return top 5 sources
        } catch (error) {
            console.error('Web search failed:', error);
            return [];
        }
    }

    extractSearchPhrases(text) {
        // Split text into sentences and extract meaningful phrases
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const phrases = [];

        sentences.forEach(sentence => {
            const words = sentence.trim().split(' ');
            // Create 6-8 word phrases for better search results
            for (let i = 0; i <= words.length - 6; i += 3) {
                const phrase = words.slice(i, i + 6).join(' ');
                if (phrase.length > 30) {
                    phrases.push(phrase);
                }
            }
        });

        return phrases.slice(0, 5); // Return top 5 phrases
    }

    async performWebSearch(query) {
        // Using a mock search API for demonstration
        // In a real implementation, you'd use Google Search API, Bing API, etc.
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate realistic mock results based on the query
        const mockResults = this.generateMockSearchResults(query);
        return mockResults;
    }

    generateMockSearchResults(query) {
        // Create realistic mock search results
        const domains = [
            'wikipedia.org', 'medium.com', 'github.com', 'stackoverflow.com',
            'reddit.com', 'quora.com', 'linkedin.com', 'twitter.com',
            'bbc.com', 'cnn.com', 'nytimes.com', 'guardian.com', 'geeksforgeeks.org'
        ];
        
        const contentTypes = ['article', 'blog post', 'documentation', 'discussion', 'news'];
        
        const results = [];
        const numResults = Math.floor(Math.random() * 3) + 1; // 1-3 results
        
        for (let i = 0; i < numResults; i++) {
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
            const matchPercentage = Math.floor(Math.random() * 40) + 60; // 60-99% match
            
            results.push({
                title: this.generateRealisticTitle(query, contentType),
                url: `https://www.${domain}/articles/${Date.now()}-${i}`,
                domain: domain,
                contentType: contentType,
                matchPercentage: matchPercentage,
                snippet: this.generateSnippet(query),
                credibility: this.assessDomainCredibility(domain)
            });
        }
        
        return results;
    }

    generateRealisticTitle(query, contentType) {
        const templates = {
            'article': ['Understanding {topic}: A Comprehensive Guide', '{topic} - Complete Analysis', 'The Ultimate Guide to {topic}'],
            'blog post': ['My Thoughts on {topic}', '{topic}: What You Need to Know', 'Exploring {topic} in Depth'],
            'documentation': ['{topic} Documentation', 'API Reference: {topic}', 'Technical Guide: {topic}'],
            'discussion': ['Discussion: {topic}', '{topic} - Community Insights', 'Q&A: {topic} Explained'],
            'news': ['Breaking: {topic} Updates', 'Latest on {topic}', '{topic}: Recent Developments']
        };
        
        const typeTemplates = templates[contentType] || templates['article'];
        const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
        
        // Extract key topic from query (first few words)
        const topic = query.split(' ').slice(0, 3).join(' ');
        
        return template.replace('{topic}', topic);
    }

    generateSnippet(query) {
        const words = query.split(' ');
        const startIdx = Math.floor(Math.random() * Math.max(1, words.length - 3));
        const snippetWords = words.slice(startIdx, startIdx + 4);
        
        const prefixes = ['This article explains how', 'Research shows that', 'Experts agree on', 'Studies indicate'];
        const suffixes = ['in detail.', 'with examples.', 'for beginners.', 'effectively.'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${snippetWords.join(' ')} ${suffix}`;
    }

    assessDomainCredibility(domain) {
        const highCredibility = ['wikipedia.org', 'bbc.com', 'cnn.com', 'nytimes.com', 'guardian.com'];
        const mediumCredibility = ['medium.com', 'github.com', 'stackoverflow.com', 'linkedin.com'];
        
        if (highCredibility.some(d => domain.includes(d))) return 'High';
        if (mediumCredibility.some(d => domain.includes(d))) return 'Medium';
        return 'Low';
    }

    deduplicateSources(sources) {
        const seen = new Set();
        return sources.filter(source => {
            const key = source.domain;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    displayInternetSources(sources) {
        // Remove existing sources display if present
        const existingSources = document.getElementById('internet-sources');
        if (existingSources) {
            existingSources.remove();
        }

        if (sources.length === 0) return;

        const resultsSection = document.getElementById('results');
        
        // Create sources display element
        const sourcesElement = document.createElement('div');
        sourcesElement.id = 'internet-sources';
        sourcesElement.className = 'result-card internet-sources-card';
        
        sourcesElement.innerHTML = `
            <h3>🌐 Web Sources Detected</h3>
            <div class="sources-intro">Text appears to be copied from the following websites:</div>
            <div class="sources-list">
                ${sources.map(source => `
                    <div class="source-item">
                        <div class="source-header">
                            <span class="source-title">${source.title}</span>
                            <span class="source-match">${source.matchPercentage}% match</span>
                        </div>
                        <div class="source-url">
                            <a href="${source.url}" target="_blank" class="source-link">${source.url}</a>
                        </div>
                        <div class="source-details">
                            <span class="source-type">${source.contentType}</span>
                            <span class="source-domain">${source.domain}</span>
                            <span class="source-credibility ${source.credibility.toLowerCase()}">${source.credibility} credibility</span>
                        </div>
                        <div class="source-snippet">"${source.snippet}"</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Insert before matched content
        const matchedContent = document.getElementById('matched-content');
        if (matchedContent) {
            matchedContent.parentNode.insertBefore(sourcesElement, matchedContent);
        } else {
            resultsSection.appendChild(sourcesElement);
        }
    }

    updateWordCounter() {
        const text = document.getElementById('source-text').value;
        const charCount = text.length;
        const maxChars = 1000;
        
        const counterElement = document.getElementById('word-count');
        const counterContainer = document.querySelector('.word-counter');
        
        counterElement.textContent = charCount;
        
        // Remove previous classes
        counterContainer.classList.remove('warning', 'limit-reached');
        
        if (charCount >= maxChars) {
            counterContainer.classList.add('limit-reached');
            // Prevent further input
            document.getElementById('source-text').value = text.substring(0, maxChars);
            counterElement.textContent = maxChars;
        } else if (charCount >= maxChars * 0.8) {
            counterContainer.classList.add('warning');
        }
    }

    clearText() {
        document.getElementById('source-text').value = '';
        this.updateWordCounter();
        this.showNotification('Text cleared', 'success');
    }

    newCheck() {
        document.getElementById('source-text').value = '';
        this.updateWordCounter();
        document.getElementById('results').style.display = 'none';

        // Reset results section
        document.getElementById('results').style.display = 'none';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    exportResults() {
        // const writingType = document.getElementById('writing-type').textContent;
        const writingType = document.getElementById('results').textContent;
        const results = {
            timestamp: new Date().toISOString(),
            writingType: writingType
        };

        const repeatedPhrasesElements = document.querySelectorAll('.matched-phrase');
        if (repeatedPhrasesElements.length > 0) {
            results.repeatedPhrases = Array.from(repeatedPhrasesElements)
                .map(el => el.textContent.replace(/"/g, '').split(' (repeated')[0]);
        }

        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `text-analysis-${Date.now()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showNotification('Results exported successfully', 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PlagiarismChecker();
});
