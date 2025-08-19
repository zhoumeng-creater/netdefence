"""
网安棋谱游戏数据初始化脚本
基于提供的文档模板初始化赛道、场景、工具等数据
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.game_models import Base, Track, Scenario, GameTool
import json


def init_database():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)


def init_tracks(db: Session):
    """初始化赛道数据 - 基于文档的9大赛道"""
    tracks_data = [
        {
            "name": "网站安全",
            "category": "website",
            "description": "针对Web应用和网站的安全攻防",
            "difficulty_range": "★★ - ★★★★",
            "sub_tracks": [
                {"name": "Web安全", "difficulty": 2},
                {"name": "数据安全", "difficulty": 4},
                {"name": "服务器安全", "difficulty": 3}
            ],
            "required_knowledge": [
                "HTTP/HTTPS协议", "SQL语言", "JavaScript", 
                "常见Web漏洞", "安全编码规范"
            ],
            "available_attacks": ["exploit", "theft", "destroy", "phish"],
            "available_defenses": ["patch", "firewall", "monitor", "vaccine"]
        },
        {
            "name": "客户端安全",
            "category": "client",
            "description": "客户端软件和系统的安全防护",
            "difficulty_range": "★★",
            "sub_tracks": [
                {"name": "软件安全", "difficulty": 2},
                {"name": "系统安全", "difficulty": 2}
            ],
            "required_knowledge": [
                "操作系统原理", "软件逆向", "恶意代码分析",
                "系统加固", "终端防护"
            ],
            "available_attacks": ["prank", "exploit", "ransom"],
            "available_defenses": ["patch", "vaccine", "monitor"]
        },
        {
            "name": "通信安全",
            "category": "communication",
            "description": "网络通信和云服务的安全",
            "difficulty_range": "★★★ - ★★★★★",
            "sub_tracks": [
                {"name": "安全运营", "difficulty": 4},
                {"name": "安全智能", "difficulty": 5},
                {"name": "云安全", "difficulty": 4},
                {"name": "无线安全", "difficulty": 3}
            ],
            "required_knowledge": [
                "网络协议", "加密算法", "云计算架构",
                "无线通信", "安全运营中心(SOC)"
            ],
            "available_attacks": ["chaos", "phish", "theft"],
            "available_defenses": ["firewall", "monitor", "taichi", "guerrilla"]
        },
        {
            "name": "移动安全",
            "category": "mobile",
            "description": "移动设备和应用的安全",
            "difficulty_range": "★★ - ★★★★",
            "sub_tracks": [
                {"name": "Android安全", "difficulty": 2},
                {"name": "iOS安全", "difficulty": 4}
            ],
            "required_knowledge": [
                "Android系统架构", "iOS安全机制",
                "移动应用逆向", "移动恶意代码"
            ],
            "available_attacks": ["exploit", "theft", "prank"],
            "available_defenses": ["patch", "vaccine", "monitor"]
        },
        {
            "name": "智能硬件安全",
            "category": "iot",
            "description": "IoT设备和智能硬件的安全",
            "difficulty_range": "★★ - ★★★★",
            "sub_tracks": [
                {"name": "应用程序安全", "difficulty": 2},
                {"name": "远程管理安全", "difficulty": 2},
                {"name": "数据隐私保护", "difficulty": 2}
            ],
            "required_knowledge": [
                "嵌入式系统", "固件分析", "IoT协议",
                "硬件安全", "侧信道攻击"
            ],
            "available_attacks": ["exploit", "theft", "destroy"],
            "available_defenses": ["patch", "firewall", "ambush"]
        },
        {
            "name": "工控安全",
            "category": "ics",
            "description": "工业控制系统安全",
            "difficulty_range": "★★★",
            "sub_tracks": [
                {"name": "安全威胁", "difficulty": 3},
                {"name": "安全防护", "difficulty": 3},
                {"name": "安全管理", "difficulty": 3}
            ],
            "required_knowledge": [
                "SCADA系统", "PLC编程", "工业协议",
                "关键基础设施保护", "安全管理体系"
            ],
            "available_attacks": ["destroy", "chaos", "ransom"],
            "available_defenses": ["firewall", "monitor", "taichi", "guerrilla"]
        },
        {
            "name": "物联网安全",
            "category": "iot_network",
            "description": "大规模物联网的安全",
            "difficulty_range": "★★ - ★★★★",
            "sub_tracks": [
                {"name": "工业物联网安全", "difficulty": 2},
                {"name": "智能家居安全", "difficulty": 4},
                {"name": "智能城市安全", "difficulty": 3}
            ],
            "required_knowledge": [
                "物联网架构", "边缘计算", "5G安全",
                "大数据安全", "隐私保护"
            ],
            "available_attacks": ["chaos", "theft", "destroy"],
            "available_defenses": ["vaccine", "guerrilla", "taichi"]
        },
        {
            "name": "安全理论",
            "category": "theory",
            "description": "网络安全理论和基础",
            "difficulty_range": "★★",
            "sub_tracks": [
                {"name": "安全普及", "difficulty": 2},
                {"name": "信安理论", "difficulty": 2},
                {"name": "区块链安全", "difficulty": 2}
            ],
            "required_knowledge": [
                "密码学", "访问控制", "安全模型",
                "区块链技术", "零知识证明"
            ],
            "available_attacks": ["exploit", "theft"],
            "available_defenses": ["patch", "vaccine", "taichi"]
        },
        {
            "name": "卫星互联网安全",
            "category": "satellite",
            "description": "卫星通信和太空互联网安全",
            "difficulty_range": "★★ - ★★★★",
            "sub_tracks": [
                {"name": "数据", "difficulty": 2},
                {"name": "航天器软件", "difficulty": 2},
                {"name": "单板机", "difficulty": 4},
                {"name": "入侵检测系统/IPS", "difficulty": 4},
                {"name": "加密货币", "difficulty": 4},
                {"name": "通讯链接", "difficulty": 4},
                {"name": "接地", "difficulty": 3},
                {"name": "预防", "difficulty": 3}
            ],
            "required_knowledge": [
                "卫星通信", "航天器系统", "空间网络",
                "量子通信", "抗干扰技术"
            ],
            "available_attacks": ["chaos", "destroy", "theft"],
            "available_defenses": ["firewall", "monitor", "guerrilla", "taichi"]
        }
    ]
    
    for track_data in tracks_data:
        # 检查是否已存在
        existing = db.query(Track).filter_by(name=track_data["name"]).first()
        if not existing:
            track = Track(**track_data)
            db.add(track)
    
    db.commit()
    print(f"初始化了 {len(tracks_data)} 个赛道")


def init_scenarios(db: Session):
    """初始化场景数据 - 基于文档模板"""
    # 获取网站安全赛道
    web_track = db.query(Track).filter_by(name="网站安全").first()
    if not web_track:
        print("未找到网站安全赛道")
        return
    
    scenarios_data = [
        {
            "track_id": web_track.id,
            "name": "电商网站SQL注入攻防",
            "difficulty": 2,
            "background_design": "某电商网站运营多年，拥有大量用户数据和交易记录。"
                               "近期安全审计发现可能存在SQL注入漏洞。",
            "scene_design": "攻击者试图通过SQL注入获取用户敏感数据，"
                          "防御方需要及时发现并阻止攻击，保护用户隐私。",
            "target_design": {
                "attacker": ["获取用户数据", "提升权限", "植入后门"],
                "defender": ["保护数据安全", "追踪攻击源", "修复漏洞"]
            },
            "elements": [
                "SQL注入", "WAF", "数据库审计", 
                "输入验证", "参数化查询"
            ],
            "attack_steps": [
                {"step": 1, "name": "信息收集", "description": "扫描网站结构，寻找注入点"},
                {"step": 2, "name": "SQL注入测试", "description": "尝试各种注入技术"},
                {"step": 3, "name": "数据提取", "description": "构造语句提取数据"},
                {"step": 4, "name": "权限提升", "description": "尝试获取更高权限"},
                {"step": 5, "name": "持久化", "description": "植入后门维持访问"}
            ],
            "penetration_methods": [
                "sql_injection", "union_injection", 
                "blind_injection", "time_based_injection"
            ],
            "defense_config": {
                "initial_tools": ["firewall", "monitor"],
                "available_tools": ["patch", "vaccine", "ambush"],
                "defense_layers": ["WAF", "IDS", "数据库防火墙"]
            },
            "initial_infrastructure": {
                "web_server": {"status": "running", "vulnerability": "medium"},
                "database": {"status": "running", "vulnerability": "high"},
                "firewall": {"status": "active", "rules": "basic"}
            },
            "vulnerabilities": [
                {"type": "sql_injection", "location": "login", "severity": "high"},
                {"type": "weak_password", "location": "admin", "severity": "medium"}
            ],
            "win_conditions": {
                "attacker": ["data_stolen", "system_compromised"],
                "defender": ["attacker_traced", "system_secured"]
            }
        },
        {
            "track_id": web_track.id,
            "name": "企业官网XSS攻击防御",
            "difficulty": 3,
            "background_design": "某大型企业官网每日访问量巨大，"
                               "包含用户评论、留言等交互功能。",
            "scene_design": "攻击者试图利用XSS漏洞窃取用户Cookie，"
                          "进行会话劫持和钓鱼攻击。",
            "target_design": {
                "attacker": ["窃取Cookie", "劫持会话", "钓鱼攻击"],
                "defender": ["过滤恶意脚本", "保护用户会话", "检测异常行为"]
            },
            "elements": [
                "XSS", "CSP", "输入过滤",
                "输出编码", "HttpOnly Cookie"
            ],
            "attack_steps": [
                {"step": 1, "name": "寻找注入点", "description": "查找可注入脚本的位置"},
                {"step": 2, "name": "构造Payload", "description": "编写恶意脚本"},
                {"step": 3, "name": "触发执行", "description": "诱导用户触发脚本"},
                {"step": 4, "name": "数据窃取", "description": "收集用户信息"},
                {"step": 5, "name": "扩大影响", "description": "利用窃取的信息"}
            ],
            "penetration_methods": [
                "reflected_xss", "stored_xss", 
                "dom_xss", "cookie_theft"
            ],
            "defense_config": {
                "initial_tools": ["monitor", "firewall"],
                "available_tools": ["patch", "vaccine", "decoy"],
                "defense_layers": ["输入验证", "输出编码", "CSP策略"]
            },
            "initial_infrastructure": {
                "web_server": {"status": "running", "vulnerability": "medium"},
                "cdn": {"status": "active", "waf": "disabled"},
                "user_system": {"status": "running", "sessions": "active"}
            },
            "vulnerabilities": [
                {"type": "xss", "location": "comment", "severity": "high"},
                {"type": "xss", "location": "search", "severity": "medium"}
            ],
            "win_conditions": {
                "attacker": ["cookie_stolen", "session_hijacked"],
                "defender": ["xss_blocked", "attacker_identified"]
            }
        },
        {
            "track_id": web_track.id,
            "name": "API接口安全对抗",
            "difficulty": 4,
            "background_design": "某金融科技公司提供RESTful API服务，"
                               "处理大量敏感金融数据。",
            "scene_design": "攻击者试图绕过API认证和授权机制，"
                          "获取未授权的数据访问。",
            "target_design": {
                "attacker": ["绕过认证", "越权访问", "数据泄露"],
                "defender": ["加强认证", "访问控制", "审计日志"]
            },
            "elements": [
                "OAuth", "JWT", "API网关",
                "速率限制", "RBAC"
            ],
            "attack_steps": [
                {"step": 1, "name": "API探测", "description": "发现API端点"},
                {"step": 2, "name": "认证绕过", "description": "尝试绕过认证"},
                {"step": 3, "name": "越权测试", "description": "测试权限边界"},
                {"step": 4, "name": "数据收集", "description": "批量获取数据"},
                {"step": 5, "name": "持续访问", "description": "维持访问权限"}
            ],
            "penetration_methods": [
                "jwt_manipulation", "api_fuzzing",
                "idor", "rate_limit_bypass"
            ],
            "defense_config": {
                "initial_tools": ["firewall", "monitor", "vaccine"],
                "available_tools": ["patch", "ambush", "guerrilla", "taichi"],
                "defense_layers": ["API网关", "认证服务", "授权服务", "审计系统"]
            },
            "initial_infrastructure": {
                "api_gateway": {"status": "running", "rate_limit": "enabled"},
                "auth_service": {"status": "running", "mfa": "disabled"},
                "database": {"status": "running", "encryption": "partial"}
            },
            "vulnerabilities": [
                {"type": "broken_auth", "location": "jwt", "severity": "high"},
                {"type": "idor", "location": "user_api", "severity": "high"},
                {"type": "rate_limit", "location": "api_gateway", "severity": "medium"}
            ],
            "win_conditions": {
                "attacker": ["mass_data_breach", "admin_access"],
                "defender": ["api_secured", "breach_prevented"]
            }
        }
    ]
    
    for scenario_data in scenarios_data:
        existing = db.query(Scenario).filter_by(
            name=scenario_data["name"],
            track_id=scenario_data["track_id"]
        ).first()
        if not existing:
            scenario = Scenario(**scenario_data)
            db.add(scenario)
    
    db.commit()
    print(f"初始化了 {len(scenarios_data)} 个场景")


def init_game_tools(db: Session):
    """初始化游戏工具数据"""
    tools_data = [
        # ========== 攻击工具（七宗罪） ==========
        {
            "tool_type": "attack",
            "method_category": "prank",
            "name": "CIH病毒",
            "description": "经典的恶作剧病毒，可破坏系统文件",
            "icon": "😈",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.6,
            "effects": {"damage": "medium", "spread": "high"},
            "requirements": [],
            "counters": ["vaccine", "patch"]
        },
        {
            "tool_type": "attack",
            "method_category": "exploit",
            "name": "SQL注入工具",
            "description": "自动化SQL注入攻击工具",
            "icon": "💉",
            "cost": 3,
            "cooldown": 1,
            "success_rate": 0.7,
            "effects": {"data_access": "high", "stealth": "medium"},
            "requirements": ["recon_complete"],
            "counters": ["firewall", "patch", "monitor"]
        },
        {
            "tool_type": "attack",
            "method_category": "theft",
            "name": "数据窃取器",
            "description": "批量窃取敏感数据",
            "icon": "🦹",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.8,
            "effects": {"data_theft": "high"},
            "requirements": ["system_access"],
            "counters": ["monitor", "vaccine"]
        },
        {
            "tool_type": "attack",
            "method_category": "destroy",
            "name": "DDoS攻击",
            "description": "分布式拒绝服务攻击",
            "icon": "💥",
            "cost": 4,
            "cooldown": 2,
            "success_rate": 0.9,
            "effects": {"availability": "critical", "damage": "high"},
            "requirements": [],
            "counters": ["firewall", "guerrilla"]
        },
        {
            "tool_type": "attack",
            "method_category": "ransom",
            "name": "勒索软件",
            "description": "加密文件并勒索赎金",
            "icon": "💰",
            "cost": 3,
            "cooldown": 1,
            "success_rate": 0.75,
            "effects": {"encryption": "full", "impact": "critical"},
            "requirements": ["system_access"],
            "counters": ["vaccine", "ambush"]
        },
        {
            "tool_type": "attack",
            "method_category": "phish",
            "name": "钓鱼邮件生成器",
            "description": "生成逼真的钓鱼邮件",
            "icon": "🎣",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.5,
            "effects": {"credential_theft": "high", "stealth": "high"},
            "requirements": [],
            "counters": ["monitor", "vaccine"]
        },
        {
            "tool_type": "attack",
            "method_category": "chaos",
            "name": "供应链攻击",
            "description": "通过第三方组件进行攻击",
            "icon": "🌪️",
            "cost": 3,
            "cooldown": 1,
            "success_rate": 0.6,
            "effects": {"spread": "wide", "persistence": "high"},
            "requirements": [],
            "counters": ["monitor", "taichi"]
        },
        
        # ========== 防御工具（八个打） ==========
        {
            "tool_type": "defense",
            "method_category": "patch",
            "name": "自动补丁系统",
            "description": "自动检测并修复已知漏洞",
            "icon": "🩹",
            "cost": 1,
            "cooldown": 0,
            "success_rate": 0.9,
            "effects": {"vulnerability_fix": "high"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "firewall",
            "name": "Web应用防火墙",
            "description": "过滤恶意请求，保护Web应用",
            "icon": "🛡️",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.8,
            "effects": {"block_rate": "high", "false_positive": "low"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "monitor",
            "name": "入侵检测系统",
            "description": "实时监控并检测异常行为",
            "icon": "👁️",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.85,
            "effects": {"detection": "high", "alert": "realtime"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "vaccine",
            "name": "主动免疫系统",
            "description": "基于AI的主动防御系统",
            "icon": "💊",
            "cost": 3,
            "cooldown": 1,
            "success_rate": 0.75,
            "effects": {"immunity": "adaptive", "learning": "continuous"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "ambush",
            "name": "蜜罐系统",
            "description": "部署诱饵系统捕获攻击者",
            "icon": "🍯",
            "cost": 3,
            "cooldown": 1,
            "success_rate": 0.7,
            "effects": {"trap": "high", "intelligence": "valuable"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "decoy",
            "name": "欺骗式防御",
            "description": "创建虚假目标误导攻击者",
            "icon": "🎭",
            "cost": 2,
            "cooldown": 0,
            "success_rate": 0.8,
            "effects": {"confusion": "high", "misdirection": "effective"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "guerrilla",
            "name": "移动目标防御",
            "description": "动态改变系统配置增加攻击难度",
            "icon": "🎯",
            "cost": 3,
            "cooldown": 0,
            "success_rate": 0.85,
            "effects": {"unpredictability": "high", "resilience": "strong"},
            "requirements": [],
            "counters": []
        },
        {
            "tool_type": "defense",
            "method_category": "taichi",
            "name": "AI自适应防御",
            "description": "基于机器学习的自适应防御系统",
            "icon": "☯️",
            "cost": 4,
            "cooldown": 2,
            "success_rate": 0.9,
            "effects": {"adaptation": "intelligent", "evolution": "continuous"},
            "requirements": [],
            "counters": []
        }
    ]
    
    for tool_data in tools_data:
        existing = db.query(GameTool).filter_by(
            name=tool_data["name"]
        ).first()
        if not existing:
            tool = GameTool(**tool_data)
            db.add(tool)
    
    db.commit()
    print(f"初始化了 {len(tools_data)} 个游戏工具")


def main():
    """主函数"""
    print("开始初始化网安棋谱游戏数据...")
    
    # 初始化数据库
    init_database()
    print("数据库表创建完成")
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 初始化各类数据
        init_tracks(db)
        init_scenarios(db)
        init_game_tools(db)
        
        print("游戏数据初始化完成！")
        
    except Exception as e:
        print(f"初始化过程中出错: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()