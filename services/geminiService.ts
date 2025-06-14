
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Flashcard, Exercise, ProjectIdea, Technology, Difficulty } from '../types';
import { API_MODEL_TEXT, TECHNOLOGY_MAP, DIFFICULTY_MAP } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY không được tìm thấy. Vui lòng đặt biến môi trường API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const uniquenessInstruction = "Hãy đảm bảo nội dung này mới và khác biệt so với những nội dung đã được tạo trước đó cho người dùng này, nếu có thể."

function parseJsonFromText<T>(text: string): T | null {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  
  jsonStr = jsonStr.replace(/儂/g, ''); 

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error("Lỗi phân tích JSON:", error, "Chuỗi gốc:", text, "Chuỗi đã xử lý (sau dọn dẹp '儂' nếu có):", jsonStr);
    return null;
  }
}

export const generateLearningContent = async (technology: Technology, topic: string): Promise<string> => {
  const techName = TECHNOLOGY_MAP[technology];
  const prompt = `Giải thích chi tiết về chủ đề '${topic}' trong ${techName}.
Nội dung phải dễ hiểu, toàn diện, và tập trung vào các phương pháp hiện đại, các thông lệ tốt nhất.
Bao gồm các ví dụ code minh họa (bằng tiếng Anh) nếu cần thiết để làm rõ các khái niệm, sử dụng markdown cho code (ví dụ: \`\`\`javascript\n// code here\n\`\`\`).
Các tiêu đề trong nội dung không được đánh số, hãy sử dụng văn bản mô tả cho tiêu đề.
${uniquenessInstruction}
Chỉ trả về phần nội dung giải thích dưới dạng một chuỗi văn bản (có thể chứa markdown).`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Lỗi tạo nội dung học tập:", error);
    throw new Error(`Không thể tạo nội dung học tập: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateFlashcards = async (technology: Technology, concept: string): Promise<Flashcard[]> => {
  const techName = TECHNOLOGY_MAP[technology];
  const prompt = `Tạo ít nhất 5 flashcards về chủ đề '${concept}' trong ${techName}. Mỗi flashcard bao gồm 'cauHoi' (câu hỏi) và 'cauTraLoi' (câu trả lời) bằng tiếng Việt. ${uniquenessInstruction} Trả về dưới dạng một mảng JSON của các đối tượng flashcard. Ví dụ: [{ "cauHoi": "...", "cauTraLoi": "..." }, ...]. Chỉ trả về mảng JSON.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const parsedData = parseJsonFromText<Flashcard[]>(response.text);
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      console.error("Dữ liệu flashcard không hợp lệ:", response.text, parsedData);
      throw new Error("Không thể tạo flashcards. Định dạng phản hồi không đúng hoặc không có flashcard nào được tạo.");
    }
    return parsedData;
  } catch (error) {
    console.error("Lỗi tạo flashcards:", error);
    throw new Error(`Không thể tạo flashcards: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateExercises = async (technology: Technology, topic: string, difficulty: Difficulty, numberOfExercises: number): Promise<Omit<Exercise, 'id' | 'isFavorite' | 'loiGiai' | 'isLoadingSolution' | 'goiYDonGian' | 'isLoadingHint'>[]> => {
  const techName = TECHNOLOGY_MAP[technology];
  const diffName = DIFFICULTY_MAP[difficulty];
  const prompt = `Tạo ${numberOfExercises} bài tập về chủ đề '${topic}' trong ${techName} ở mức độ '${diffName}'. Mỗi bài tập phải bằng tiếng Việt và có các phần: 'tieuDe' (tiêu đề), 'moTa' (mô tả bài toán), 'deBai' (đề bài, có thể bao gồm đoạn code ví dụ nếu cần, sử dụng markdown cho code ví dụ: \`\`\`${technology.toLowerCase()}\n// code here\n\`\`\`). Phân biệt rõ ràng giữa văn bản mô tả và các khối mã. Tất cả các ví dụ code phải được viết bằng tiếng Anh. ${uniquenessInstruction} Trả về một MẢNG JSON chứa ${numberOfExercises} đối tượng bài tập. Ví dụ: [{ "tieuDe": "...", "moTa": "...", "deBai": "..." }, ...]. Chỉ trả về mảng JSON.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
       config: {
        responseMimeType: "application/json",
      }
    });
    
    const parsedData = parseJsonFromText<Omit<Exercise, 'id' | 'isFavorite' | 'loiGiai' | 'isLoadingSolution' | 'goiYDonGian' | 'isLoadingHint'>[]>(response.text);
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
       console.error("Dữ liệu bài tập không hợp lệ:", response.text, parsedData);
      throw new Error("Không thể tạo bài tập. Định dạng phản hồi không đúng hoặc không có bài tập nào được tạo.");
    }
    return parsedData;
  } catch (error) {
    console.error("Lỗi tạo bài tập:", error);
    throw new Error(`Không thể tạo bài tập: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateSolutionForExercise = async (exercise: Pick<Exercise, 'tieuDe' | 'moTa' | 'deBai'>, technology: Technology): Promise<string> => {
  const techName = TECHNOLOGY_MAP[technology];
  const prompt = `Tạo lời giải chi tiết bằng tiếng Việt cho bài tập sau về ${techName}:
Bài tập:
Tiêu đề: ${exercise.tieuDe}
Mô tả: ${exercise.moTa}
Đề bài: ${exercise.deBai}

Lời giải nên bao gồm giải thích rõ ràng các bước và code ví dụ (nếu cần, sử dụng markdown cho code, ví dụ: \`\`\`${technology.toLowerCase()}\n// code here\n\`\`\`). Tất cả các ví dụ code phải được viết bằng tiếng Anh. ${uniquenessInstruction} Chỉ trả về phần nội dung lời giải dưới dạng một chuỗi văn bản (có thể chứa markdown).`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Lỗi tạo lời giải:", error);
    throw new Error(`Không thể tạo lời giải: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateSimpleHintForExercise = async (exercise: Pick<Exercise, 'tieuDe' | 'moTa' | 'deBai'>, technology: Technology): Promise<string> => {
  const techName = TECHNOLOGY_MAP[technology];
  const prompt = `Cung cấp một gợi ý đơn giản, ngắn gọn (không quá 2-3 câu, không chứa code) bằng tiếng Việt cho bài tập sau về ${techName}:
Bài tập:
Tiêu đề: ${exercise.tieuDe}
Mô tả: ${exercise.moTa}
Đề bài: ${exercise.deBai}

Gợi ý này chỉ nên hướng dẫn cách tiếp cận hoặc một khái niệm quan trọng cần nhớ, không phải là lời giải chi tiết hay code. ${uniquenessInstruction} Chỉ trả về phần nội dung gợi ý dưới dạng một chuỗi văn bản ngắn.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Lỗi tạo gợi ý đơn giản:", error);
    throw new Error(`Không thể tạo gợi ý đơn giản: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const generateProjectIdea = async (technologies: Technology[], topic?: string): Promise<ProjectIdea> => {
  const techNames = technologies.map(tech => TECHNOLOGY_MAP[tech]).join(', ');
  let prompt = `Tạo một ý tưởng dự án web đơn giản bằng tiếng Việt, sử dụng các công nghệ: ${techNames}.`;
  if (topic && topic.trim() !== '') {
    prompt += ` Ý tưởng nên tập trung hoặc liên quan đến chủ đề: '${topic}'.`;
  }
  prompt += ` Ý tưởng phải bao gồm: 'tenDuAn' (tên dự án), 'moTaNganGon' (mô tả ngắn gọn), 'tinhNangChinh' (mảng các chuỗi mô tả tính năng chính hay), và 'congNgheGoiY' (mảng các chuỗi tên công nghệ gợi ý thêm, nếu có). Tất cả các ví dụ code trong các phần (nếu được yêu cầu sau này như hướng dẫn chi tiết) phải được viết bằng tiếng Anh. ${uniquenessInstruction} Trả về một đối tượng JSON duy nhất. Ví dụ: { "tenDuAn": "...", "moTaNganGon": "...", "tinhNangChinh": ["...", "..."], "congNgheGoiY": ["..."] }. Đảm bảo rằng phản hồi CHỈ chứa đối tượng JSON hợp lệ, không có bất kỳ ký tự hoặc văn bản nào khác bên ngoài cấu trúc JSON. Chỉ trả về đối tượng JSON.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
       config: {
        responseMimeType: "application/json",
      }
    });
    
    const parsedData = parseJsonFromText<Omit<ProjectIdea, 'id' | 'isFavorite'>>(response.text);
     if (!parsedData || typeof parsedData.tenDuAn === 'undefined') { // Check for a key property
      console.error("Dữ liệu ý tưởng dự án không hợp lệ:", response.text, parsedData);
      throw new Error("Không thể tạo ý tưởng dự án. Định dạng phản hồi không đúng.");
    }
    return parsedData as ProjectIdea;
  } catch (error) {
    console.error("Lỗi tạo ý tưởng dự án:", error);
    throw new Error(`Không thể tạo ý tưởng dự án: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateProjectDetails = async (projectIdea: Pick<ProjectIdea, 'tenDuAn' | 'moTaNganGon' | 'congNgheGoiY'>): Promise<string> => {
  const techNames = projectIdea.congNgheGoiY && projectIdea.congNgheGoiY.length > 0 
    ? projectIdea.congNgheGoiY.join(', ') 
    : "các công nghệ phù hợp";
  const prompt = `Cung cấp hướng dẫn chi tiết từng bước bằng tiếng Việt để thực hiện dự án "${projectIdea.tenDuAn}".
Mô tả dự án: ${projectIdea.moTaNganGon}.
Công nghệ gợi ý: ${techNames}.
Hướng dẫn nên bao gồm các mục chính như:
1.  Thiết lập môi trường.
2.  Cấu trúc thư mục dự án gợi ý.
3.  Các bước thực hiện chính cho từng tính năng.
4.  Các đoạn code ví dụ quan trọng (sử dụng markdown cho code, ví dụ: \`\`\`javascript\n// code here\n\`\`\`). Đảm bảo các khối code được phân biệt rõ ràng. Tất cả các ví dụ code phải được viết bằng tiếng Anh.
${uniquenessInstruction} Chỉ trả về phần nội dung hướng dẫn chi tiết dưới dạng một chuỗi văn bản (có thể chứa markdown). Không cần tạo một ứng dụng mẫu hoàn chỉnh.`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Lỗi tạo hướng dẫn chi tiết:", error);
    throw new Error(`Không thể tạo hướng dẫn chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateProjectSuggestions = async (projectIdea: Pick<ProjectIdea, 'tenDuAn'>): Promise<string[]> => {
  const prompt = `Đưa ra một số (khoảng 3-5) gợi ý cải tiến hoặc tính năng mở rộng bằng tiếng Việt cho dự án "${projectIdea.tenDuAn}". ${uniquenessInstruction} Trả về một mảng JSON các chuỗi gợi ý. Ví dụ: ["Thêm xác thực người dùng OAuth", "Tích hợp API gửi email thông báo", "Triển khai Dark Mode"]. Chỉ trả về mảng JSON.`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: API_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const parsedData = parseJsonFromText<string[]>(response.text);
    if (!parsedData || !Array.isArray(parsedData)) {
      console.error("Dữ liệu gợi ý thêm không hợp lệ:", response.text, parsedData);
      // Fallback for non-JSON array plain list (less likely with responseMimeType: "application/json")
      if (typeof response.text === 'string' && response.text.length > 0 && !response.text.trim().startsWith('{') && !response.text.trim().startsWith('[')) {
        try {
            const potentialArray = response.text.split('\n').map(s => s.replace(/^- /, '').trim()).filter(Boolean); // Corrected '\\n' to '\n'
            if (potentialArray.length > 0) return potentialArray;
        } catch (e) { /* ignore split error */ }
      }
      throw new Error("Không thể tạo gợi ý thêm. Định dạng phản hồi không đúng.");
    }
    return parsedData;
  } catch (error) {
    console.error("Lỗi tạo gợi ý thêm:", error);
    throw new Error(`Không thể tạo gợi ý thêm: ${error instanceof Error ? error.message : String(error)}`);
  }
};