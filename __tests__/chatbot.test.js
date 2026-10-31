/**
 * P9: the chatbot talks to the BE RAG chat (no OpenAI/SerpAPI key in the app).
 */
jest.mock('../src/services/semantic.api', () => ({
  chatWithRAG: jest.fn(),
  clearChatSession: jest.fn(async () => true),
  generateSessionId: jest.fn(),
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');
const semantic = require('../src/services/semantic.api');
const chatbot = require('../src/services/chatbot.api');

let store;
let ids;
beforeEach(() => {
  jest.clearAllMocks();
  store = {};
  ids = 0;
  AsyncStorage.setItem.mockImplementation(async (key, value) => {store[key] = value;});
  AsyncStorage.getItem.mockImplementation(async key => (key in store ? store[key] : null));
  semantic.generateSessionId.mockImplementation(() => `session_${++ids}`);
});

const reply = (extra = {}) => ({success: true, message: 'Cầu Rồng phun lửa cuối tuần.', session_id: 'session_1',
  sources: [{entity_type: 'location', entity_id: 3, title: 'Cầu Rồng', relevance_score: 0.6,
    image_url: 'https://img/cau-rong.jpg'}, {entity_type: 'item', entity_id: 9, title: 'Cầu Rồng', relevance_score: 0.5}],
  ...extra});

describe('chatbot.api via BE RAG chat', () => {
  it('sends only the last user message with one persistent session; the BE keeps history', async () => {
    semantic.chatWithRAG.mockResolvedValue(reply());
    const history = [
      {role: 'assistant', content: 'Xin chào!'},
      {role: 'user', content: 'Đà Nẵng có gì?'},
      {role: 'assistant', content: '...'},
      {role: 'user', content: 'Cầu Rồng có gì đặc biệt?'},
    ];
    expect(await chatbot.sendChatMessage(history)).toEqual({message: 'Cầu Rồng phun lửa cuối tuần.'});
    await chatbot.sendChatMessage(history, 'system prompt is ignored');
    expect(semantic.chatWithRAG.mock.calls.map(([request]) => request)).toEqual([
      {message: 'Cầu Rồng có gì đặc biệt?', session_id: 'session_1', include_sources: true},
      {message: 'Cầu Rồng có gì đặc biệt?', session_id: 'session_1', include_sources: true},
    ]);
  });

  it('sends an attached (uploaded) photo as image_url, with a default question when there is no text', async () => {
    semantic.chatWithRAG.mockResolvedValue(reply());
    await chatbot.sendChatMessage([{role: 'user', content: [
      {type: 'image_url', image_url: {url: 'https://storage.googleapis.com/b/uploads/1/a.jpg'}}]}]);
    expect(semantic.chatWithRAG.mock.calls[0][0]).toMatchObject({
      message: 'Đây là gì? Hãy mô tả chi tiết.', image_url: 'https://storage.googleapis.com/b/uploads/1/a.jpg'});
  });

  it('returns the BE error (quota, login) instead of a reply', async () => {
    semantic.chatWithRAG.mockResolvedValue({success: false, sources: [], session_id: '',
      error: 'Mỗi ngày chỉ hỏi tối đa 30 câu, vui lòng thử lại vào ngày mai'});
    expect(await chatbot.sendChatMessage([{role: 'user', content: 'hi'}])).toEqual({
      message: '', error: 'Mỗi ngày chỉ hỏi tối đa 30 câu, vui lòng thử lại vào ngày mai'});
  });

  it('"show me photos" uses the catalog images of the last answer; no external image search', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {throw new Error('no external calls');});
    semantic.chatWithRAG.mockResolvedValue(reply());
    await chatbot.sendChatMessage([{role: 'user', content: 'Cho tôi xem ảnh Cầu Rồng'}]);
    expect(chatbot.isImageSearchRequest('Cho tôi xem ảnh Cầu Rồng')).toBe(true);
    expect(await chatbot.searchImage('Cầu Rồng', 3)).toEqual({imageUrls: ['https://img/cau-rong.jpg']});
    semantic.chatWithRAG.mockResolvedValue(reply({sources: []}));
    await chatbot.sendChatMessage([{role: 'user', content: 'Cho tôi xem ảnh trăng'}]);
    expect(await chatbot.searchImage('trăng')).toEqual({error: 'Chưa có ảnh trong dữ liệu của ứng dụng cho nội dung này.'});
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('a new conversation clears the BE session and starts another one', async () => {
    semantic.chatWithRAG.mockResolvedValue(reply());
    await chatbot.sendChatMessage([{role: 'user', content: 'hi'}]);
    await chatbot.resetChatSession();
    expect(semantic.clearChatSession).toHaveBeenCalledWith('session_1');
    await chatbot.sendChatMessage([{role: 'user', content: 'hi'}]);
    expect(semantic.chatWithRAG.mock.calls[1][0].session_id).toBe('session_2');
  });
});
