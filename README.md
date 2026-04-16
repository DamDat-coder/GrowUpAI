import os

# Nội dung file README.md cho dự án GrowUp AI
readme_content = """
# GrowUp AI - Advanced RAG & Agentic Chatbot System

**GrowUp AI** là một hệ thống chatbot thông minh được thiết kế nhằm mục đích hỗ trợ học tập và xử lý tài liệu kỹ thuật. Dự án tập trung vào việc áp dụng các kỹ thuật tiên tiến trong lĩnh vực AI như Retrieval-Augmented Generation (RAG) và tư duy Agentic để cung cấp câu trả lời chính xác dựa trên dữ liệu nội bộ.

##  Tính năng chính
- **Cơ chế RAG (Retrieval-Augmented Generation):** Cho phép nạp (ingest) các file tài liệu PDF, phân tách và lưu trữ dưới dạng Vector Embeddings vào ChromaDB để tra cứu thông tin chính xác.
- **Agentic Reasoning (Thử nghiệm):** Sử dụng LangChain Agent để tự động quyết định việc sử dụng công cụ (Web Search, RAG, Calculator) dựa trên câu hỏi của người dùng.
- **Xử lý bất đồng bộ (Async):** Xây dựng trên nền tảng FastAPI giúp tối ưu hóa hiệu suất và hỗ trợ Streaming Response (SSE).
- **Tối ưu hóa Intent:** Kết hợp SBERT để phân loại ý định người dùng trước khi đưa vào xử lý chuyên sâu, giúp tiết kiệm tài nguyên API.

##  Công nghệ sử dụng
- **Ngôn ngữ:** Python 3.10+
- **AI Frameworks:** LangChain, Google Gemini API (1.5 Flash & Pro)
- **Vector Database:** ChromaDB
- **Backend:** FastAPI (Python), Node.js (Express - làm Gateway)
- **Frontend:** React / Next.js
- **Tools:** DuckDuckGo Search API, Ollama (Local Embeddings), PyPDF2

##  Cấu trúc dự án (Phần AI)
```text
AI/
├── core/
│   ├── database.py    # Cấu hình VectorDB
│   ├── engine.py      # Logic truy vấn RAG (Similarity Search)
│   ├── excutor.py     # Thực thi các bước theo kế hoạch đã định
│   ├── goals.py       # Định nghĩa các intent
│   ├── ingester.py    # Xử lý nạp tài liệu và Embedding
│   ├── planner.py     # Chiến lược thực thi hành động
│   ├── tools.py       # Cấu hình các công cụ thực thi
│   └── understand.py  # Định nghĩa các input được nhận
│
├── data/              # Thư mục chứa tài liệu PDF đầu vào
├── utils/             # Các hàm bổ trợ và kết nối Gemini
├── tasks/             # Các công cụ cơ bản
├── app.py             # FastAPI entry point
└── state.py/          # Định nghĩa các state

Backend/
├── src/
│   ├── config/      # Cấu hình môi trường và dịch vụ bên thứ 3
│   ├── controllers/ # Xử lý logic nghiệp vụ cho từng Route
│   ├── middlewares/ # Kiểm tra Auth, Logging, Validation
│   ├── models/      # Định nghĩa Schema dữ liệu (MongoDB)
│   ├── routes/      # Định nghĩa các Endpoint API
│   ├── services/    # Logic kết nối với AI Service (FastAPI)
│   └── utils/       # Các hàm helper dùng chung

Frontend/
├── app/            # Routes và Layout chính
├── components/     # UI Components (Chat box, Sidebar, Button...)
├── contexts/       # Global State (Auth, Chat Context)
├── services/       # Gọi API đến Backend Gateway
└── hooks/          # Custom hooks xử lý logic UI