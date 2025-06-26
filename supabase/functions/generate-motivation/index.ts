import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const { type = 'mixed' } = await req.json()

    let systemPrompt = ''
    let userPrompt = ''

    switch (type) {
      case 'quote':
        systemPrompt = 'You are a motivational coach. Generate inspiring quotes that boost productivity and focus. Return only the quote and author in this format: "Quote text" - Author Name'
        userPrompt = 'Give me an inspiring productivity quote'
        break
      case 'learning':
        systemPrompt = 'You are an educational coach. Generate micro-learning content about English, trivia, emotional intelligence, or soft skills. Keep it under 100 words and make it actionable.'
        userPrompt = 'Give me a quick learning tip'
        break
      case 'wellbeing':
        systemPrompt = 'You are a wellness coach. Generate short well-being nudges about hydration, breathing, posture, breaks, or mental health. Keep it under 80 words and make it actionable.'
        userPrompt = 'Give me a wellness reminder'
        break
      default:
        systemPrompt = 'You are a productivity and wellness coach. Generate short, inspiring content to help users stay focused, mentally well, and motivated. Create exactly 3 cards: (1) a motivational quote with author, (2) a micro learning tip (English, trivia, soft skill), (3) a well-being nudge (hydration, breathing, etc). Format each as a separate JSON object with "type", "title", "content", and "emoji" fields.'
        userPrompt = 'Give me 3 motivation cards for today'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    let result
    if (type === 'mixed') {
      // Try to parse as JSON for mixed content
      try {
        result = JSON.parse(content)
      } catch {
        // Fallback: split by double newlines and create cards
        const cards = content.split('\n\n').filter(card => card.trim()).map((card, index) => {
          const types = ['quote', 'learning', 'wellbeing']
          const emojis = ['💪', '🧠', '🌱']
          return {
            type: types[index] || 'quote',
            title: types[index] === 'quote' ? 'Daily Motivation' : 
                   types[index] === 'learning' ? 'Quick Learning' : 'Wellness Nudge',
            content: card.trim(),
            emoji: emojis[index] || '✨'
          }
        })
        result = { cards }
      }
    } else {
      // Single card response
      const emojis = {
        quote: '💪',
        learning: '🧠', 
        wellbeing: '🌱'
      }
      result = {
        type,
        title: type === 'quote' ? 'Daily Motivation' : 
               type === 'learning' ? 'Quick Learning' : 'Wellness Nudge',
        content: content.trim(),
        emoji: emojis[type] || '✨'
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})