
export type Language = 'en' | 'es' | 'zh' | 'hi' | 'ar';

export const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية' },
];

export const translations: Record<string, Record<Language, string>> = {
  // AppHeader & AppFooter
  navHome: { en: 'Home', es: 'Inicio', zh: '首页', hi: 'होम', ar: 'الرئيسية' },
  navBlogs: { en: 'Blogs', es: 'Blogs', zh: '博客', hi: 'ब्लॉग', ar: 'المدونات' },
  navPricing: { en: 'Pricing', es: 'Precios', zh: '价钱', hi: 'मूल्य निर्धारण', ar: 'التسعير' },
  navAbout: { en: 'About', es: 'Sobre', zh: '关于', hi: 'हमारे बारे में', ar: 'عنا' },
  navContact: { en: 'Contact', es: 'Contacto', zh: '联系', hi: 'संपर्क', ar: 'اتصل' },
  navPrivacy: { en: 'Privacy Policy', es: 'Política de Privacidad', zh: '隐私政策', hi: 'गोपनीयता नीति', ar: 'سياسة الخصوصية' },
  navDocuments: { en: 'Documents', es: 'Documentos', zh: '文件', hi: 'दस्तावेज़', ar: 'مستندات' },
  login: { en: 'Login', es: 'Iniciar Sesión', zh: '登录', hi: 'लॉग इन करें', ar: 'تسجيل الدخول' },
  signup: { en: 'Sign Up', es: 'Regístrate', zh: '报名', hi: 'साइन अप करें', ar: 'اشتراك' },
  register: { en: 'Register', es: 'Registrarse', zh: '注册', hi: 'रजिस्टर करें', ar: 'تسجيل' },
  signout: { en: 'Sign Out', es: 'Cerrar Sesión', zh: '登出', hi: 'साइन आउट', ar: 'تسجيل الخروج' },
  navSettings: { en: 'Settings', es: 'Ajustes', zh: '设置', hi: 'सेटिंग्स', ar: 'الإعدادات' },

  // Homepage
  pageTitle: {
    en: "PDF to Excel Converter",
    es: "Convertidor de PDF a Excel",
    zh: "PDF到Excel转换器",
    hi: "पीडीएफ से एक्सेल कनवर्टर",
    ar: "محول PDF إلى Excel",
  },
  pageDescription: {
    en: "Upload your PDF, preview the AI-structured data, and download it as an Excel file.",
    es: "Sube tu PDF, previsualiza los datos estructurados por IA y descárgalo como un archivo de Excel.",
    zh: "上传您的PDF，预览AI结构化的数据，并将其下载为Excel文件。",
    hi: "अपना पीडीएफ अपलोड करें, एआई-संरचित डेटा का पूर्वावलोकन करें, और इसे एक्सेल फ़ाइल के रूप में डाउनलोड करें।",
    ar: "قم بتحميل ملف PDF الخاص بك، واستعرض البيانات المهيكلة بواسطة الذكاء الاصطناعي، وقم بتنزيلها كملف Excel.",
  },
  fileUploaderDrag: {
    en: "Drag & drop a PDF file here",
    es: "Arrastra y suelta un archivo PDF aquí",
    zh: "在此处拖放PDF文件",
    hi: "यहां एक पीडीएफ फाइल खींचें और छोड़ें",
    ar: "اسحب وأفلت ملف PDF هنا",
  },
  fileUploaderOr: {
    en: "or",
    es: "o",
    zh: "或者",
    hi: "या",
    ar: "أو",
  },
  fileUploaderClick: {
    en: "Click to select file",
    es: "Haz clic para seleccionar un archivo",
    zh: "点击选择文件",
    hi: "फ़ाइल चुनने के लिए क्लिक करें",
    ar: "انقر لتحديد ملف",
  },

  // Feature Section
  featureSectionTitle: {
    en: "Why Choose {siteTitle}?",
    es: "¿Por qué elegir {siteTitle}?",
    zh: "为什么选择{siteTitle}？",
    hi: "{siteTitle} क्यों चुनें?",
    ar: "لماذا تختار {siteTitle}؟",
  },
  featureSectionDescription: {
    en: "Streamline your PDF to Excel workflow with powerful and intuitive features.",
    es: "Optimiza tu flujo de trabajo de PDF a Excel con funciones potentes e intuitivas.",
    zh: "借助强大直观的功能，简化您的PDF到Excel工作流程。",
    hi: "शक्तिशाली और सहज सुविधाओं के साथ अपने पीडीएफ से एक्सेल वर्कफ़्लो को सुव्यवस्थित करें।",
    ar: "قم بتبسيط سير عمل PDF إلى Excel الخاص بك بميزات قوية وبديهية.",
  },
  featureSecure: {
    en: "Secure Conversion",
    es: "Conversión Segura",
    zh: "安全转换",
    hi: "सुरक्षित रूपांतरण",
    ar: "تحويل آمن",
  },
  featureSecureDesc: {
    en: "Your documents are processed securely and are not stored after conversion.",
    es: "Tus documentos se procesan de forma segura y no se almacenan después de la conversión.",
    zh: "您的文档经过安全处理，转换后不会被存储。",
    hi: "आपके दस्तावेज़ सुरक्षित रूप से संसाधित होते हैं और रूपांतरण के बाद संग्रहीत नहीं होते हैं।",
    ar: "تتم معالجة مستنداتك بشكل آمن ولا يتم تخزينها بعد التحويل.",
  },
  featureInstant: {
    en: "Instant Download",
    es: "Descarga Instantánea",
    zh: "即时下载",
    hi: "तुरंत डाउनलोड",
    ar: "تنزيل فوري",
  },
  featureInstantDesc: {
    en: "Quickly download your structured Excel file as soon as it’s ready.",
    es: "Descarga rápidamente tu archivo de Excel estructurado tan pronto como esté listo.",
    zh: "准备就绪后，立即快速下载您的结构化Excel文件。",
    hi: "जैसे ही यह तैयार हो जाए, अपनी संरचित एक्सेल फ़ाइल को तुरंत डाउनलोड करें।",
    ar: "قم بتنزيل ملف Excel المنظم الخاص بك بسرعة بمجرد أن يكون جاهزًا.",
  },
  featureAI: {
    en: "AI-Powered Structuring",
    es: "Estructuración con IA",
    zh: "AI驱动的结构化",
    hi: "एआई-पावर्ड स्ट्रक्चरिंग",
    ar: "هيكلة مدعومة بالذكاء الاصطناعي",
  },
  featureAIDesc: {
    en: "Advanced AI accurately interprets PDF layouts for a clean Excel output.",
    es: "La IA avanzada interpreta con precisión los diseños de PDF para una salida de Excel limpia.",
    zh: "先进的AI可准确解释PDF布局，以实现干净的Excel输出。",
    hi: "उन्नत एआई एक स्वच्छ एक्सेल आउटपुट के लिए पीडीएफ लेआउट की सटीक व्याख्या करता है।",
    ar: "يفسر الذكاء الاصطناعي المتقدم تخطيطات PDF بدقة للحصول على إخراج Excel نظيف.",
  }
};
