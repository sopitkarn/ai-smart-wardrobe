lib/geminiClient.js
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error in recommendOutfit:', error);
    throw error;
  }
}
