// shared/constants/game.constants.ts
export const GAME_CONFIG = {
  MAX_ROUNDS: 15,
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 3,
  TURN_TIMEOUT: 120, // seconds
  RECONNECT_TIMEOUT: 30, // seconds
  
  INITIAL_RESOURCES: {
    attacker: {
      compute: { value: 100, max: 100 },
      zeroday: { value: 5, max: 10 },
      time: { value: 50, max: 50 }
    },
    defender: {
      budget: { value: 1000, max: 1000 },
      manpower: { value: 20, max: 20 },
      repair: { value: 30, max: 30 }
    },
    monitor: {
      investigation: { value: 50, max: 50 },
      authority: { value: 30, max: 30 },
      intel: { value: 40, max: 40 }
    }
  },
  
  INITIAL_LAYERS: {
    network: { health: 100, maxHealth: 100, defense: 20 },
    application: { health: 100, maxHealth: 100, defense: 15 },
    data: { health: 100, maxHealth: 100, defense: 25 },
    physical: { health: 100, maxHealth: 100, defense: 30 },
    personnel: { health: 100, maxHealth: 100, defense: 10 }
  },
  
  DAMAGE_MULTIPLIERS: {
    critical: 1.5,
    normal: 1.0,
    reduced: 0.5
  },
  
  RESOURCE_RECOVERY_RATE: 0.1, // 10% per round
  
  SCORING: {
    DAMAGE_DEALT: 1,
    DAMAGE_BLOCKED: 2,
    LAYER_BREACH: 50,
    RESOURCE_EFFICIENT: 10,
    PERFECT_DEFENSE: 100,
    GAME_WIN: 200
  }
};

export const TACTICS_CONFIG = {
  attacker: [
    {
      id: 'apt_recon',
      name: 'APT侦察',
      cost: { compute: 10, time: 5 },
      cooldown: 0,
      description: '深度信息收集，发现薄弱点'
    },
    {
      id: 'zero_day',
      name: '0day攻击',
      cost: { zeroday: 1, compute: 30 },
      cooldown: 3,
      description: '使用未公开漏洞进行攻击'
    },
    {
      id: 'ddos',
      name: 'DDoS攻击',
      cost: { compute: 50, time: 10 },
      cooldown: 2,
      description: '分布式拒绝服务攻击'
    },
    {
      id: 'social_eng',
      name: '社会工程',
      cost: { time: 15 },
      cooldown: 1,
      description: '针对人员层的心理攻击'
    },
    {
      id: 'supply_chain',
      name: '供应链攻击',
      cost: { compute: 40, time: 20, zeroday: 1 },
      cooldown: 4,
      description: '通过供应链渗透目标'
    }
  ],
  defender: [
    {
      id: 'patch_update',
      name: '补丁更新',
      cost: { budget: 100, manpower: 3 },
      cooldown: 0,
      description: '修复已知漏洞，提升防御'
    },
    {
      id: 'honeypot',
      name: '蜜罐部署',
      cost: { budget: 150, manpower: 5 },
      cooldown: 2,
      description: '部署欺骗防御系统'
    },
    {
      id: 'incident_response',
      name: '应急响应',
      cost: { manpower: 8, repair: 15 },
      cooldown: 1,
      description: '快速响应并修复损害'
    },
    {
      id: 'threat_hunting',
      name: '威胁狩猎',
      cost: { manpower: 6, budget: 80 },
      cooldown: 1,
      description: '主动搜索潜在威胁'
    },
    {
      id: 'zero_trust',
      name: '零信任架构',
      cost: { budget: 300, manpower: 10 },
      cooldown: 3,
      description: '部署零信任安全架构'
    }
  ],
  monitor: [
    {
      id: 'trace_source',
      name: '溯源追踪',
      cost: { investigation: 15, intel: 10 },
      cooldown: 1,
      description: '追踪攻击来源'
    },
    {
      id: 'legal_sanction',
      name: '法律制裁',
      cost: { authority: 20, investigation: 20 },
      cooldown: 3,
      description: '对攻击者实施法律制裁'
    },
    {
      id: 'intel_sharing',
      name: '情报共享',
      cost: { intel: 15 },
      cooldown: 0,
      description: '向防守方提供威胁情报'
    },
    {
      id: 'emergency_takeover',
      name: '紧急接管',
      cost: { authority: 25, investigation: 25 },
      cooldown: 4,
      description: '紧急接管受损系统'
    },
    {
      id: 'public_disclosure',
      name: '公开披露',
      cost: { intel: 20, authority: 10 },
      cooldown: 2,
      description: '公开攻击手法，警示他人'
    }
  ]
};