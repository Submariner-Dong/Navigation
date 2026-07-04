// 图片地址配置 - 统一管理版
const BASE_URL = "https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com";

// 轮播图片配置
const carouselImages = {
  CAROUSEL_1: "carousel-1.png",  // 轮播图1
  CAROUSEL_2: "carousel-2.jpg",  // 轮播图2
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
  INDEX_BUTTON_2: "index-button-3.png",
  INDEX_BUTTON_3: "index-button-4.png",
  INDEX_BUTTON_4: "index-button-5(needchange).png",
  INDEX_BUTTON_5: "index-button-2.png"
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

// 科普视频配置（相对路径，自动拼接 BASE_URL）
const scienceVideos = {
  VIDEO_5_DENTAL_IMPLANT: "videos/DentalImplantPromotion.mp4",     // 即拔即种即吃饭（暂时隐藏）
  VIDEO_6_CRACKED_TOOTH: "videos/CrackedToothSyn.mp4",              // 小隐裂，大隐患
  VIDEO_7_CARE_FOR_TEETH: "videos/C2.mp4",                         // 趣味护牙，健康成长
  VIDEO_8_ORAL_TOWN: "videos/C3.mp4",                              // 探秘粉红王国——口腔小镇
  VIDEO_9_BABY_TOOTH: "videos/C4.mp4",                             // 乳牙撞坏无所谓？绿茵场上要当心！
  VIDEO_10_CAVITY_FIGHT: "videos/C5.mp4",                          // "蛀牙"也爱吃甜食？牙齿保卫战大揭秘！
  VIDEO_11_NIGHT_GRINDING: "videos/C6.mp4",                        // 夜半三更"咔咔"声？
  VIDEO_12_WISDOM_TOOTH: "videos/C7.mp4",                         // 智齿，和智慧有关吗？
  VIDEO_13_OCCLUSION: "videos/C8.mp4",                             // 地包天，天包地，错𬌗畸形要警惕
  VIDEO_14_CARPET: "videos/C9.mp4"                                 // 口腔地毯（待定）
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

// 添加科普视频完整URL
Object.keys(scienceVideos).forEach(key => {
  imageConfig[key] = `${BASE_URL}/${scienceVideos[key]}`;
});

export default imageConfig;