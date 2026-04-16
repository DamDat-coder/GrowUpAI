# GrowUp AI - Advanced RAG & Agentic Chatbot System

**GrowUp AI** là một hệ thống chatbot thông minh đa tầng, được thiết kế nhằm mục đích hỗ trợ học tập và xử lý tài liệu kỹ thuật. Dự án kết hợp sức mạnh của Next.js, Node.js (TypeScript) và FastAPI để tạo ra một trải nghiệm AI mạnh mẽ, hỗ trợ Retrieval-Augmented Generation (RAG).

##  Tính năng chính
- **Cơ chế RAG (Retrieval-Augmented Generation):** Cho phép nạp (ingest) các file tài liệu PDF, phân tách và lưu trữ dưới dạng Vector Embeddings vào ChromaDB để tra cứu thông tin chính xác.
- **Agentic Reasoning (Thử nghiệm):** Sử dụng LangChain Agent để tự động quyết định việc sử dụng công cụ (Web Search, RAG, Calculator) dựa trên câu hỏi của người dùng.
- **Xử lý bất đồng bộ (Async):** Xây dựng trên nền tảng FastAPI giúp tối ưu hóa hiệu suất và hỗ trợ Streaming Response (SSE).
- **Tối ưu hóa Intent:** Kết hợp SBERT để phân loại ý định người dùng trước khi đưa vào xử lý chuyên sâu, giúp tiết kiệm tài nguyên API.
- **Real-time Streaming:** Hỗ trợ phản hồi tức thì thông qua luồng dữ liệu liên tục từ AI Server về Frontend.
- **Xác thực & Bảo mật:** Tích hợp Middleware xác thực cho các yêu cầu API từ người dùng.

##  Công nghệ sử dụng
###  AI Core
- **Ngôn ngữ:** Python 3.10+  
- **AI Frameworks:** LangChain, Google Gemini API (1.5 Flash & Pro)  
- **Vector Database:** ChromaDB  
- **Backend:** FastAPI (Python), Node.js (Express - làm Gateway)  
- **Frontend:** React / Next.js  
- **Tools:** DuckDuckGo Search API, Ollama (Local Embeddings), PyPDF2  

---

###  Frontend (Next.js)
- **Framework:** Next.js 14+ (App Router)  
- **Styling:** Tailwind CSS  
- **State Management:** React Context & Hooks  
- **API Communication:** Axios & Server-Sent Events (SSE)  

---

###  Backend Gateway (Node.js/Express)
- **Language:** TypeScript  
- **Chức năng:**  
  - Điều phối yêu cầu (Orchestrator)  
  - Quản lý người dùng  
  - Lưu trữ lịch sử trò chuyện  
  - Đóng vai trò Gateway kết nối với AI Service  
- **ORM/Database:** MongoDB (dựa trên cấu trúc models hiện có)  

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
