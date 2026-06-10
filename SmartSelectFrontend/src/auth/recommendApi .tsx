import api from "../axios/api";
import { HistoryItem } from "../types/HistoryItem";
import { RecommendationRequest } from "../types/RecommendationRequest";
import { RecommendationResponse } from "../types/RecommendationResponse";



export const recommendApi = {
  getRecommendations: async (
    data: RecommendationRequest
  ): Promise<RecommendationResponse> => {
    const res = await api.post<RecommendationResponse>('/recommend', data);
    return res.data;
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const res = await api.get<HistoryItem[]>('/history');
    return res.data;
  },
};