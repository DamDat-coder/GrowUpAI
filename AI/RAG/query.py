# Truy vấn và Trả lời
import os
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from langchain.retrievers.multi_query import MultiQueryRetriever 

from get_vector_db import get_vector_db

load_dotenv()

def query(user_query):
    # Khởi tạo LLM với llama3.1
    llm = ChatOllama(model=os.getenv("LLM_MODEL", "llama3.1"))
    
    db = get_vector_db()
    
    # Thiết lập MultiQueryRetriever
    retriever = MultiQueryRetriever.from_llm(
        retriever=db.as_retriever(), 
        llm=llm
    )

    # Hàm hỗ trợ gộp tài liệu
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    template = """Dựa vào ngữ cảnh dưới đây để trả lời câu hỏi:
    {context}
    
    Câu hỏi: {question}
    """
    prompt = ChatPromptTemplate.from_template(template)

    # Xây dựng RAG Chain
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain.invoke(user_query)