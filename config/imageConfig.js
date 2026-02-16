// 图片地址配置 - 统一管理版
const BASE_URL = "https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com";

// 轮播图片配置
const carouselImages = {
  CAROUSEL_1: "carousel-1.png",  // 轮播图1
  CAROUSEL_2: "carousel-2.png",  // 轮播图2
  CAROUSEL_3: "carousel-3.png"   // 轮播图3
};

// 头像图片配置
const avatarImages = {
  AI_AVATAR: "ai-avatar.png",
  USER_AVATAR: "user-avatar.png"
};

// 首页按钮图片配置
const indexButtonImages = {
  INDEX_BUTTON_1: "index-button-1.png",
  INDEX_BUTTON_2: "index-button3.png",
  INDEX_BUTTON_3: "index-button-4(needchange).png",
  INDEX_BUTTON_4: "index-button-5(needchange).png"
};

// 导航图片配置
const navigationImages = {
  GATE: "gate.jpg",
  PASSAGE: "passage.jpg",
  "1-STAIRS": "1-stairs.jpg",
  "1-ELEVATOR": "1-elevator.jpg",
  "2-ELEVATOR": "2-elevator.jpg"
};

// 科室专用图片配置
const departmentImages = {
  "2-RADIOLOGY-1": "2-radiology-1.jpg",
  "2-PEDIATRIC-1": "2-pediatric-1.jpg",
  "1-ORTHODONTICS-1": "1-orthodontics-1.jpg",
  "1-PERIODONTOLOGY-1": "1-periodontology-1.jpg", 
  "1-Conservative Dentistry and Endodontics-1": "1-Conservative%20Dentistry%20and%20Endodontics-1.jpg", 
  "LABORATORY-1": "laboratory-1.jpg", 
  "1-PROSTHODONTICS-1": "1-Prosthodontics-1.jpg", 
  "1-ORALANDMAXILLOFACIALSURGERY-1": "1-Oralandmaxillofacialsurgery-1.jpg"
};

// 底部导航栏图标配置
const navIcons = {
  HOME_ICON: "home-icon.png",       // 首页图标
  PROFILE_ICON: "profile-icon.png"  // 个人中心图标
};

// 动态生成完整URL
const imageConfig = {};

// 添加轮播图片
Object.keys(carouselImages).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${carouselImages[key]}`;
});

// 添加头像图片
Object.keys(avatarImages).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${avatarImages[key]}`;
});

// 添加首页按钮图片
Object.keys(indexButtonImages).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${indexButtonImages[key]}`;
});

// 添加导航图片
Object.keys(navigationImages).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${navigationImages[key]}`;
});

// 添加科室图片
Object.keys(departmentImages).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${departmentImages[key]}`;
});

// 添加导航栏图标
Object.keys(navIcons).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${navIcons[key]}`;
});

export default imageConfig;