# AI-Powered Response System

The extension now uses AI-generated responses throughout, making interactions natural and dynamic.

## AI Integration Points

### 1. **Main Argument Evaluation** (`callCerebrasForEvaluation`)
- Evaluates each user argument in real-time
- Considers product context and conversation history
- **Provides fun, witty, varied responses**
- **Always quotes user's exact words**
- Awards time reductions generously
- Temperature: 1.1 for maximum variety
- Max tokens: 100 (keeps responses short and punchy)

**Response Style:**
- SHORT (1-2 sentences max)
- Wildly varied tone (sarcastic, supportive, shocked, playful)
- Always quotes their exact words
- Includes product-specific humor
- Suggests funny alternatives

**Example responses:**

Strong argument:
```
"Okay okay, 'my laptop exploded' - fair enough! Still, refurbs are 40% cheaper..."
"'Saved for 6 months'? Respect! But have you seen last year's model?"
"You said 'need it for work' - can't argue with paychecks!"
```

Weak argument:
```
"'It looks cool'? So does your bank account with money in it!"
"LOL 'I want it' isn't a reason, it's a confession!"
"Really? 'Just because'? Your wallet is literally crying!"
```

Product-specific humor:
```
iPad: "Another YouTube machine, huh?"
Phone: "$1000 for a slightly better camera? Math isn't mathing!"
Laptop: "Have you tried turning your old one off and on?"
Watch: "Your phone already tells time..."
```

**What it evaluates:**
- Practical necessity (up to -15s)
- Budget planning (up to -12s)
- Research mentioned (up to -10s)
- Long-term value (up to -8s)
- Product specificity (up to -5s)

**No penalties - worst case is 0 seconds:**
- Emotional reasoning: 0s (no time saved)
- Vague language: 0s (no time saved)
- False/extreme claims: 0s (no time saved)

### 2. **Alternative Suggestions**
The AI actively suggests practical alternatives:

**Types of alternatives suggested:**
- **Cheaper options**: Refurbished, older models, different brands
- **Different categories**: "Do you need an iPad or would a Kindle work?"
- **Free/cheaper solutions**: Use what you have, borrow, library
- **Question necessity**: "Does your current phone still work?"

**Product-specific examples:**
- iPad/Tablet → Kindle or e-reader
- Laptop → Refurbished or last year's model (40% less)
- Phone → Repair current one instead
- Headphones → Generic brands (80% quality, 50% price)
- Camera → Your phone camera might be enough
- Smartwatch → Regular watch without smart features

### 3. **Penalty Feedback** (`getAIPenaltyFeedback`)
- Generates custom responses for cheating attempts
- Types: repetitive, gibberish, too_short
- Temperature: 0.9 for creative, varied responses
- Max tokens: 50 (brief, punchy responses)

**Examples:**
- Repetitive: "Come on, you already said that. Give me something new!"
- Gibberish: "That's just keyboard mashing. Try forming actual words."
- Too short: "Can you elaborate? I need more than a few words."

### 3. **Final Assessment** (`getFinalAssessment`)
- Comprehensive evaluation at the end
- Reviews all arguments provided
- Considers grade and time saved
- Provides personalized final judgment
- Temperature: 0.8
- Max tokens: 150 (2-3 sentences)

**Tailored by grade:**
- A/B: Congratulatory, affirming
- C: Neutral, thoughtful
- D/F: Concerned, encouraging reconsideration

## Fallback System

All AI functions have fallback logic if:
- API key is not configured
- API request fails
- Response parsing fails

Fallbacks use pattern matching and keyword detection to provide reasonable responses.

## Conversation Memory

The AI maintains **full conversation memory** throughout the session:

**What it remembers:**
- Every argument you've made
- Every response it's given
- Product information
- Time saved/penalties
- Contradictions in your reasoning

**How it uses memory:**
- References previous points: "You mentioned earlier that..."
- Calls out contradictions: "Wait, you just said X, now you're saying Y?"
- Builds on previous arguments: "That's better than your first point about..."
- Tracks repetition: Detects if you're repeating the same argument
- Provides coherent conversation flow

**Technical implementation:**
- Stores full conversation in `conversationMessages` array
- Passes last 10 exchanges to AI (to avoid token limits)
- Each message includes role (user/assistant) and content
- AI receives complete context for every evaluation
- Final assessment references specific things you said

## Response Format

AI responses follow this format:
```
[FEEDBACK]: 
• First point acknowledging or challenging
• Second point with specific feedback
• Third point with question or rebuttal
[TIME]: -15
```

The system parses this to extract:
- Feedback text with bullet points (displayed to user)
- Time reduction value (applied to timer)

Bullet points are preserved and displayed with proper formatting.

## Benefits

1. **Structured Feedback**: Clear bullet points make evaluation easy to understand
2. **Active Rebuttals**: AI challenges weak arguments with tough questions
3. **Full Conversation Memory**: AI remembers everything you've said and references it
4. **Catches Contradictions**: AI calls out when you contradict yourself
5. **Varied Responses**: Same argument gets different feedback each time
6. **Product-Specific**: Evaluations consider the actual product
7. **Critical Thinking**: Pushes users to think deeper about their purchases
8. **Coherent Dialogue**: Feels like talking to someone who's actually listening

## Configuration

**See [CEREBRAS_SETUP.md](CEREBRAS_SETUP.md) for detailed setup instructions!**

Quick steps:
1. Get API key from https://cloud.cerebras.ai/
2. Copy `config.example.js` to `config.js`
3. Add your key: `window.CEREBRAS_API_KEY = 'your-api-key-here';`

Without an API key, the system uses fallback logic (less fun but still works!).
