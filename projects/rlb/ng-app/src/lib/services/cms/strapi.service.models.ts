export interface MenuItem {
    ContentId: string
    Order: number
    Title: string
    page: Page
    home: Home
    menu_items: MenuItem[]
  }
  
  export interface Home {
    ContentId: string
    MenuName: string
    Abstract: string
    Content: string
    Picture: any
    Head: any
    topics: Topic[]
  }
  
  export interface Page {
    ContentId: string
    Title: string
    Content: string
    page_tabs: Tab[]
    topics: Topic[]
    Cover: any
  }
  
  export interface Topic {
    id: string
    ContentId: string
    Title: string
    Content: string
    Picture: any
    page: Page
  }
  
  export interface Tab {
    id: string
    ContentId: string
    Title: string
    Icon: string
    Content: string
    FaqTitle: string
    FaqContent: string
    steps: Step[]
    faqs: Faq[]
  }
  
  export interface Step {
    ContentId: string
    Title: string
    Content: string
    Picture: any
  }
  
  export interface FaqGroup {
    ContentId: string
    Title: string
    Content: string
    faqs: Faq[]
  }
  
  export interface Faq {
    ContentId: string
    Title: string
    Content: string
    Question: string
    Answer: string
  }
  