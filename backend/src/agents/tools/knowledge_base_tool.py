"""Knowledge Base Tool for Portia AI"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import structlog
from portia import Tool

logger = structlog.get_logger(__name__)

class KnowledgeSearchInput(BaseModel):
    query: str = Field(description="Search query for knowledge base")
    category: Optional[str] = Field(default=None, description="Filter by category")
    max_results: int = Field(default=5, description="Maximum number of results")

class KnowledgeCreateInput(BaseModel):
    title: str = Field(description="Knowledge article title")
    content: str = Field(description="Article content")
    category: str = Field(description="Article category")
    tags: Optional[List[str]] = Field(default=None, description="Article tags")

class KnowledgeBaseTool(Tool):
    """Custom Portia tool for knowledge base operations"""
    
    name = "knowledge_base_tool"
    description = "Search and manage company knowledge base articles"
    
    def __init__(self):
        super().__init__()
        # Mock knowledge base data
        self.knowledge_base = [
            {
                "id": "kb_1",
                "title": "How to Process Refunds",
                "content": "Step 1: Verify customer eligibility. Step 2: Check refund policy. Step 3: Process refund through payment gateway.",
                "category": "refunds",
                "tags": ["refund", "payment", "policy"],
                "created_at": "2025-08-01T10:00:00Z"
            },
            {
                "id": "kb_2", 
                "title": "Account Update Procedures",
                "content": "To update customer account information: 1. Verify identity. 2. Update fields in system. 3. Send confirmation email.",
                "category": "account_management",
                "tags": ["account", "update", "verification"],
                "created_at": "2025-08-01T11:00:00Z"
            },
            {
                "id": "kb_3",
                "title": "Escalation Guidelines",
                "content": "Escalate to supervisor when: Customer is angry, Request exceeds $500, Technical issue requires engineering team.",
                "category": "escalation",
                "tags": ["escalation", "supervisor", "guidelines"],
                "created_at": "2025-08-01T12:00:00Z"
            }
        ]
        logger.info("KnowledgeBaseTool initialized with mock data")
    
    async def search_knowledge(self, input_data: KnowledgeSearchInput) -> Dict[str, Any]:
        """Search knowledge base articles"""
        
        try:
            # Simple search implementation
            query_lower = input_data.query.lower()
            results = []
            
            for article in self.knowledge_base:
                # Check if query matches title, content, or tags
                matches_title = query_lower in article["title"].lower()
                matches_content = query_lower in article["content"].lower()
                matches_tags = any(query_lower in tag.lower() for tag in article["tags"])
                matches_category = (input_data.category is None or 
                                 article["category"] == input_data.category)
                
                if (matches_title or matches_content or matches_tags) and matches_category:
                    # Calculate simple relevance score
                    score = 0
                    if matches_title:
                        score += 3
                    if matches_content:
                        score += 2
                    if matches_tags:
                        score += 1
                    
                    results.append({
                        **article,
                        "relevance_score": score
                    })
            
            # Sort by relevance and limit results
            results.sort(key=lambda x: x["relevance_score"], reverse=True)
            results = results[:input_data.max_results]
            
            logger.info("Knowledge base searched", 
                       query=input_data.query, 
                       results_found=len(results))
            
            return {
                "success": True,
                "results": results,
                "total_count": len(results),
                "message": f"Found {len(results)} relevant articles"
            }
            
        except Exception as e:
            logger.error("Knowledge base search failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to search knowledge base"
            }
    
    async def create_article(self, input_data: KnowledgeCreateInput) -> Dict[str, Any]:
        """Create new knowledge base article"""
        
        try:
            article_id = f"kb_{len(self.knowledge_base) + 1}"
            
            new_article = {
                "id": article_id,
                "title": input_data.title,
                "content": input_data.content,
                "category": input_data.category,
                "tags": input_data.tags or [],
                "created_at": "2025-08-23T10:00:00Z"
            }
            
            self.knowledge_base.append(new_article)
            
            logger.info("Knowledge article created", 
                       article_id=article_id, 
                       title=input_data.title)
            
            return {
                "success": True,
                "article": new_article,
                "message": f"Article '{input_data.title}' created successfully"
            }
            
        except Exception as e:
            logger.error("Article creation failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create article"
            }
    
    async def call(self, action: str, **kwargs) -> Dict[str, Any]:
        """Main tool entry point"""
        
        if action == "search":
            input_data = KnowledgeSearchInput(**kwargs)
            return await self.search_knowledge(input_data)
            
        elif action == "create":
            input_data = KnowledgeCreateInput(**kwargs)
            return await self.create_article(input_data)
            
        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}",
                "message": "Supported actions: search, create"
            }