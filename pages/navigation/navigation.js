Page({
  data: {
    floors: ["一楼", "二楼", "三楼"],
    currentFloor: "一楼",
    floorImage: "/images/floor1.png"
  },
  onFloorChange: function(e) {
    const floor = this.data.floors[e.detail.value];
    this.setData({
      currentFloor: floor,
      floorImage: `/images/floor${e.detail.value + 1}.png`
    });
  }
})