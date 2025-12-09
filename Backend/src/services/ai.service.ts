import axios from "axios";

export const aiService = {
  generate: async (input: string): Promise<string> => {
    const res = await axios.post("http://localhost:8000/predict", {
      prompt: input
    });

    return res.data.reply;
  }
};
