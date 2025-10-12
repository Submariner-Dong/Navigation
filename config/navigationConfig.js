import imageConfig from "./imageConfig";

// 导航路径配置
const navigationConfig = {
  "正畸科": {
    steps: [
      { image: imageConfig.GATE, text: "进入同济大学口腔医院" },
      {
        options: [
          { type: "stairs", image: imageConfig["1-STAIRS"], text: "沿楼梯上楼至2楼" },
          { type: "elevator", image: imageConfig["1-ELEVATOR"], text: "上电梯前往2楼" }
        ]
      },
      { image: imageConfig["1-ORTHODONTICS-1"], text: "成功到达正畸科，治疗顺利！" }
    ]
  },
  "放射科": {
    steps: [
      { image: imageConfig.GATE, text: "进入同济大学口腔医院" },
      { image: imageConfig.PASSAGE, text: "穿过过道" },
      { image: imageConfig["2-RADIOLOGY-1"], text: "成功到达放射科，治疗顺利！" }
    ]
  },
  "儿科/儿童口腔科": {
    steps: [
      { image: imageConfig.GATE, text: "进入同济大学口腔医院" },
      { image: imageConfig.PASSAGE, text: "穿过过道" },
      { image: imageConfig["2-ELEVATOR"], text: "乘电梯或走楼梯前往4楼" },
      { image: imageConfig["2-PEDIATRIC-1"], text: "成功到达儿科/儿童口腔科，治疗顺利！" }
    ]
  }
};

export default navigationConfig;