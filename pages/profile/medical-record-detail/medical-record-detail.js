const UserDataManager = require('../../../utils/userDataManager.js');

Page({
  data: {
    medicalRecord: null,
    detailedInfo: {
      "就诊时间": "",
      "科室": "",
      "医生": "",
      "主诉": "",
      "诊断结果": "",
      "治疗经过": "",
      "用药信息": "",
      "复诊信息": "",
      "检查结果": "",
      "医嘱": ""
    },
    currentRecordId: null // 记录当前病历ID，用于onShow时重新拉取最新数据
  },

  onLoad(options) {
    // 启用分享菜单，确保转发功能可用
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.loadRecordData(options);
  },

  // 页面显示时（从编辑页返回）重新加载最新数据
  onShow() {
    // 仅当已有记录数据时才刷新（避免首次加载重复）
    if (this.data.currentRecordId && this.data.medicalRecord) {
      this.refreshCurrentRecord();
    }
  },

  // 加载记录数据（onLoad / 刷新共用）
  loadRecordData(options) {
    if (options.record) {
      const record = JSON.parse(decodeURIComponent(options.record));
      this.setData({
        medicalRecord: record,
        detailedInfo: this.generateDetailedInfo(record),
        currentRecordId: record.id
      });
    }
  },

  // 从本地存储重新拉取当前记录的最新数据（用于编辑返回后同步）
  refreshCurrentRecord() {
    try {
      const userData = UserDataManager.loadUserData();
      const records = userData.medicalData.medicalRecords || [];
      
      // 先在手动添加的病历中查找
      let updatedRecord = records.find(r => r.id === this.data.currentRecordId);
      
      if (updatedRecord) {
        // 找到了，更新显示
        this.setData({
          medicalRecord: updatedRecord,
          detailedInfo: this.generateDetailedInfo(updatedRecord)
        });
      }
      // 如果是医院模拟病历，数据不变无需处理
    } catch (error) {
      console.error('刷新病历数据失败:', error);
    }
  },

  // 生成详细的病历信息
  generateDetailedInfo(record) {
    // 手动添加的病历：直接使用用户填写的详细数据
    if (record.isManual) {
      return {
        "就诊时间": record.visitTime,
        "科室": record.department,
        "医生": record.doctor,
        "主诉": record.mainComplaint || '未填写',
        "诊断结果": record.diagnosis || '未填写',
        "治疗经过": record.treatmentProcess || '未填写',
        "用药信息": record.medication || '未填写',
        "复诊信息": record.followUp || '未填写',
        "检查结果": record.examination || '未填写',
        "医嘱": record.advice || '未填写'
      };
    }

    // 模拟医院系统返回的详细病历信息
    const departments = {
      '牙体牙髓病科': '专注于牙齿硬组织和牙髓疾病的诊断与治疗',
      '牙周科': '专注于牙龈和牙周组织的疾病治疗',
      '口腔修复科': '专注于牙齿缺失和缺损的修复治疗',
      '口腔正畸科': '专注于牙齿排列不齐的矫正治疗',
      '口腔颌面外科': '专注于口腔颌面部的手术治疗',
      '儿童口腔科': '专注于儿童口腔疾病的预防和治疗',
      '口腔预防科': '专注于口腔疾病的预防和保健'
    };

    const treatments = {
      '龋齿修复': {
        mainComplaint: '牙齿出现蛀洞，伴有冷热刺激敏感',
        diagnosis: '中度龋齿',
        treatmentProcess: '局部麻醉后，使用高速手机去除腐质，备洞，酸蚀，冲洗吹干，涂布粘接剂，光固化树脂充填，调整咬合，抛光',
        medication: '术后无需特殊用药，注意口腔卫生',
        followUp: '建议6个月后复查，注意观察充填体情况',
        examination: 'X光片显示牙体硬组织缺损，未累及牙髓',
        advice: '注意口腔卫生，定期复查，减少甜食摄入'
      },
      '牙龈炎治疗': {
        mainComplaint: '牙龈出血，刷牙时明显，伴有轻微牙龈肿胀',
        diagnosis: '慢性牙龈炎',
        treatmentProcess: '牙周洁治，去除牙菌斑和牙结石，牙龈冲洗，口腔卫生指导',
        medication: '术后使用氯己定漱口水，每日两次，连续一周',
        followUp: '建议1个月后复查牙龈状况',
        examination: '牙周探诊深度2-3mm，牙龈轻度红肿，探诊出血',
        advice: '改善刷牙方法，使用牙线，定期洁牙'
      },
      '牙齿矫正': {
        mainComplaint: '牙齿排列不齐，影响美观和功能',
        diagnosis: '牙列拥挤，前牙反颌',
        treatmentProcess: '取模，拍片分析，制定矫正方案，粘接托槽，定期调整',
        medication: '无特殊用药，矫正期间注意饮食',
        followUp: '每月复诊调整一次，预计矫正周期2年',
        examination: '全景片显示牙列拥挤，头影测量分析显示骨性II类关系',
        advice: '保持口腔卫生，避免硬食，按时复诊'
      },
      '智齿拔除': {
        mainComplaint: '智齿反复发炎，影响正常咀嚼',
        diagnosis: '阻生智齿，冠周炎',
        treatmentProcess: '局部麻醉，切开牙龈，去除骨阻力，拔除智齿，缝合伤口',
        medication: '术后口服抗生素3天，止痛药按需服用',
        followUp: '术后7天拆线，观察伤口愈合情况',
        examination: '全景片显示智齿水平阻生，压迫邻牙',
        advice: '术后24小时冷敷，避免剧烈运动，软食为主'
      },
      '牙周炎治疗': {
        mainComplaint: '牙龈萎缩，牙齿松动，咀嚼无力',
        diagnosis: '慢性牙周炎',
        treatmentProcess: '牙周基础治疗，包括洁治、刮治、根面平整，必要时牙周手术',
        medication: '术后使用抗生素和消炎药，配合牙周维护',
        followUp: '每3个月复查一次，定期维护治疗',
        examination: '牙周探诊深度4-6mm，附着丧失，牙槽骨吸收',
        advice: '加强口腔卫生，定期牙周维护，戒烟限酒'
      },
      '根管治疗': {
        mainComplaint: '牙齿剧烈疼痛，夜间加重，无法正常咀嚼',
        diagnosis: '急性牙髓炎',
        treatmentProcess: '开髓，拔髓，根管预备，消毒，根管充填，冠部修复',
        medication: '术后按需服用止痛药，必要时抗生素治疗',
        followUp: '治疗后1周复查，观察症状缓解情况',
        examination: '冷热测试剧烈疼痛，叩诊阳性，X光片显示根尖周阴影',
        advice: '避免用患牙咀嚼硬物，按时完成治疗'
      }
    };

    const treatmentInfo = treatments[record.diagnosis] || {
      mainComplaint: '患者因口腔不适就诊',
      diagnosis: record.diagnosis,
      treatmentProcess: '常规口腔治疗完成',
      medication: '按医嘱用药，注意口腔卫生',
      followUp: '建议定期复查',
      examination: '常规口腔检查未见明显异常',
      advice: '保持良好的口腔卫生习惯'
    };

    return {
      "就诊时间": record.visitTime,
      "科室": `${record.department}（${departments[record.department] || '口腔专科'}）`,
      "医生": `${record.doctor} 主治医师`,
      "主诉": treatmentInfo.mainComplaint,
      "诊断结果": treatmentInfo.diagnosis,
      "治疗经过": treatmentInfo.treatmentProcess,
      "用药信息": treatmentInfo.medication,
      "复诊信息": treatmentInfo.followUp,
      "检查结果": treatmentInfo.examination,
      "医嘱": treatmentInfo.advice
    };
  },

  // 复制病历信息
  copyMedicalRecord() {
    const recordText = this.formatRecordText();
    wx.setClipboardData({
      data: recordText,
      success: () => {
        wx.showToast({
          title: '病历信息已复制',
          icon: 'success'
        });
      }
    });
  },

  // 格式化病历文本
  formatRecordText() {
    const { medicalRecord, detailedInfo } = this.data;
    let text = `病历详情\n`;
    text += `====================\n`;
    
    for (const [key, value] of Object.entries(detailedInfo)) {
      text += `${key}：${value}\n`;
    }
    
    text += `====================\n`;
    text += `就诊医院：同济大学附属口腔医院\n`;
    text += `病历编号：${medicalRecord.id}\n`;
    
    return text;
  },

  // 分享病历信息
  shareMedicalRecord() {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  onShareAppMessage() {
    const { medicalRecord } = this.data;
    return {
      title: `我的口腔病历 - ${medicalRecord.department}`,
      path: `/pages/profile/medical-record-detail/medical-record-detail?record=${encodeURIComponent(JSON.stringify(medicalRecord))}`
    };
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 编辑病历（跳转到病历填写页面并回填数据）
  editMedicalRecord() {
    const { medicalRecord } = this.data;

    if (!medicalRecord || !medicalRecord.isManual) {
      wx.showToast({ title: '仅支持编辑手动添加的病历', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/profile/medical-record/medical-record?record=${encodeURIComponent(JSON.stringify(medicalRecord))}`
    });
  }
})