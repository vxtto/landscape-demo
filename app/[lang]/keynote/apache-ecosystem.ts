import type { Locale } from "../dictionaries";
import { type Localized, pick } from "./i18n";

export type ApacheDomainKey =
  | "data"
  | "libraries"
  | "network"
  | "web"
  | "operations"
  | "security"
  | "edge";

export type ApacheProject = {
  name: string;
  repo: string;
  logo: string;
  source: "landscape" | "ant";
  role: Localized<string>;
  signal: string;
};

export type ResolvedApacheProject = Omit<ApacheProject, "role"> & {
  role: string;
};

const apacheDomainsSource: Record<
  ApacheDomainKey,
  {
    label: string;
    count: number;
    definition: Localized<string>;
    officialLabels: string[];
    heads: [string, string][];
    landscape: string[];
  }
> = {
  data: {
    label: "Data, analytics & AI",
    count: 80,
    definition: {
      en: "Covers data processing, databases, search, analytics, and AI compute. The six Apache projects in the Agentic AI landscape sit mostly in this domain.",
      zh: "覆盖数据处理、数据库、搜索、分析与 AI 计算。Agentic AI 全景图中的六个 Apache 项目主要落在这一领域。",
    },
    officialLabels: [
      "big-data",
      "database",
      "data-engineering",
      "search",
      "sql",
    ],
    heads: [
      ["Superset", "74.0k"],
      ["ECharts", "66.9k"],
      ["Airflow", "46.3k"],
      ["Spark", "43.7k"],
      ["Kafka", "33.3k"],
      ["Flink", "26.2k"],
    ],
    landscape: ["Airflow", "Spark", "Iceberg"],
  },
  libraries: {
    label: "Libraries, languages & formats",
    count: 119,
    definition: {
      en: "Cross-language libraries, data formats, programming languages, and shared components — the common surface between agent runtimes, tools, and data services.",
      zh: "跨语言库、数据格式、编程语言与通用组件。它们是 Agent runtime、工具和数据服务之间的公共连接面。",
    },
    officialLabels: ["library", "xml", "java", "python", "c / c++", "graphics"],
    heads: [
      ["ECharts", "66.9k"],
      ["bRPC", "17.6k"],
      ["Arrow", "17.0k"],
      ["Thrift", "10.9k"],
      ["DataFusion", "9.0k"],
      ["IoTDB", "6.4k"],
    ],
    landscape: ["Hudi"],
  },
  network: {
    label: "Network, messaging & integration",
    count: 41,
    definition: {
      en: "Service connectivity, messaging, protocols, and system integration — the layer that carries state across tools during execution.",
      zh: "覆盖服务连接、消息传递、协议与系统集成，支撑跨工具执行中的状态流转。",
    },
    officialLabels: [
      "network-server",
      "network-client",
      "http",
      "integration",
    ],
    heads: [
      ["Arrow", "17.0k"],
      ["Thrift", "10.9k"],
      ["Tomcat", "8.2k"],
      ["CouchDB", "6.9k"],
      ["Camel", "6.3k"],
      ["Ignite", "5.1k"],
    ],
    landscape: [],
  },
  web: {
    label: "Web & application platforms",
    count: 37,
    definition: {
      en: "Web frameworks, content processing, and application platforms. Few current Apache projects in the Agentic landscape sit in this domain.",
      zh: "覆盖 Web 框架、内容处理与应用平台。当前 Agentic landscape 中的 Apache 项目较少落在这一领域。",
    },
    officialLabels: ["web-framework", "content", "javaee", "mobile"],
    heads: [
      ["Tomcat", "8.2k"],
      ["CouchDB", "6.9k"],
      ["Shiro", "4.4k"],
      ["Tika", "3.9k"],
      ["Nutch", "3.3k"],
      ["PDFBox", "3.1k"],
    ],
    landscape: [],
  },
  operations: {
    label: "Cloud, build & operations",
    count: 34,
    definition: {
      en: "Cloud platforms, build, testing, and observability. Once agents reach production, these are the release, diagnostic, and operational disciplines they inherit.",
      zh: "云平台、构建、测试与可观测性。Agent 进入生产以后，需要从这里继承发布、诊断和运行治理能力。",
    },
    officialLabels: [
      "cloud",
      "build-management",
      "testing",
      "observability",
      "osgi",
    ],
    heads: [
      ["SkyWalking", "24.9k"],
      ["JMeter", "9.5k"],
      ["Camel", "6.3k"],
      ["Maven", "5.3k"],
      ["Ignite", "5.1k"],
      ["CloudStack", "3.0k"],
    ],
    landscape: [],
  },
  security: {
    label: "Security & identity",
    count: 4,
    definition: {
      en: "Access control, identity, and security infrastructure. Few projects, but they mark the boundary that matters once agents hold more system privileges.",
      zh: "访问控制、身份与安全基础设施。项目数量不大，但它们对应 Agent 获得更多系统权限后的关键边界。",
    },
    officialLabels: [
      "security",
      "identity-management",
      "identity-provisioning",
    ],
    heads: [
      ["Ranger", "1.1k"],
      ["Syncope", "335"],
      ["Santuario", "57"],
      ["Fortress", "53"],
    ],
    landscape: [],
  },
  edge: {
    label: "IoT & geospatial",
    count: 9,
    definition: {
      en: "Devices, spatial data, and edge scenarios — extending Apache's data infrastructure into the physical environment.",
      zh: "覆盖设备、空间数据与边缘场景，把 Apache 的数据基础设施延伸到物理环境。",
    },
    officialLabels: ["iot", "geospatial"],
    heads: [
      ["IoTDB", "6.4k"],
      ["Calcite", "5.2k"],
      ["Ignite", "5.1k"],
      ["PLC4X", "1.7k"],
      ["Mynewt", "889"],
      ["SIS", "124"],
    ],
    landscape: [],
  },
};

export function getApacheDomains(lang: Locale) {
  const entries = Object.entries(apacheDomainsSource) as [
    ApacheDomainKey,
    (typeof apacheDomainsSource)[ApacheDomainKey],
  ][];
  return Object.fromEntries(
    entries.map(([key, domain]) => [
      key,
      { ...domain, definition: pick(lang, domain.definition) },
    ]),
  ) as Record<
    ApacheDomainKey,
    Omit<(typeof apacheDomainsSource)[ApacheDomainKey], "definition"> & {
      definition: string;
    }
  >;
}

const apacheBackboneSource: {
  label: string;
  title: Localized<string>;
  projects: ApacheProject[];
}[] = [
  {
    label: "01 · WORK ENTERS THE SYSTEM",
    title: { en: "Orchestrate the task, run the computation", zh: "编排任务，完成计算" },
    projects: [
      {
        name: "Apache Airflow",
        repo: "apache/airflow",
        logo: "/keynote/apache/assets/project-logos/airflow.png",
        source: "landscape",
        role: {
          en: "Workflow orchestration with traceable execution",
          zh: "工作流编排与可追踪执行",
        },
        signal: "Data · Integration",
      },
      {
        name: "Apache Spark",
        repo: "apache/spark",
        logo: "/keynote/apache/assets/project-logos/spark.png",
        source: "landscape",
        role: {
          en: "Large-scale data processing and distributed compute",
          zh: "大规模数据处理与分布式计算",
        },
        signal: "Compute & scheduling",
      },
      {
        name: "Apache Celeborn",
        repo: "apache/celeborn",
        logo: "/keynote/apache/assets/project-logos/celeborn.png",
        source: "ant",
        role: {
          en: "Keeps shuffle and spilled data flowing reliably",
          zh: "让 shuffle 与 spilled data 稳定流动",
        },
        signal: "Ant deep participation · TLP",
      },
    ],
  },
  {
    label: "02 · STATE BECOMES SHARED",
    title: {
      en: "Share data, metadata, and cross-language state",
      zh: "共享数据、元数据与跨语言状态",
    },
    projects: [
      {
        name: "Apache Iceberg",
        repo: "apache/iceberg",
        logo: "/keynote/apache/assets/project-logos/iceberg.png",
        source: "landscape",
        role: { en: "Open table format with versioned data", zh: "开放表格式与版本化数据" },
        signal: "Data · Governance",
      },
      {
        name: "Apache Hudi",
        repo: "apache/hudi",
        logo: "/keynote/apache/assets/project-logos/hudi.png",
        source: "landscape",
        role: {
          en: "Incremental upserts, deletes, and change processing",
          zh: "增量更新、删除与变更处理",
        },
        signal: "Data · Governance",
      },
      {
        name: "Apache Paimon",
        repo: "apache/paimon",
        logo: "/keynote/apache/assets/project-logos/paimon.png",
        source: "landscape",
        role: { en: "Streaming-batch unified lakehouse", zh: "流批一体的实时 lakehouse" },
        signal: "Data · Governance",
      },
      {
        name: "Apache Gravitino",
        repo: "apache/gravitino",
        logo: "/keynote/apache/assets/project-logos/gravitino.png",
        source: "landscape",
        role: { en: "A cross-system catalog for data and models", zh: "跨系统数据与模型目录" },
        signal: "Data · Governance",
      },
      {
        name: "Apache Fory",
        repo: "apache/fory",
        logo: "/keynote/apache/assets/project-logos/fory.png",
        source: "ant",
        role: {
          en: "High-performance, multi-language serialization and state exchange",
          zh: "高性能、多语言序列化与状态交换",
        },
        signal: "Ant deep participation · TLP",
      },
    ],
  },
  {
    label: "03 · ACTIONS NEED CONSEQUENCES",
    title: {
      en: "Keep relational context current, handle execution failure",
      zh: "更新关系上下文，处理执行失败",
    },
    projects: [
      {
        name: "Apache GeaFlow",
        repo: "apache/geaflow",
        logo: "/keynote/apache/assets/project-logos/geaflow.svg",
        source: "ant",
        role: {
          en: "Streaming graph compute with continuously updated relational context",
          zh: "流图计算与持续更新的关系上下文",
        },
        signal: "Ant deep participation · Incubating",
      },
      {
        name: "Apache Seata",
        repo: "apache/incubator-seata",
        logo: "/keynote/apache/assets/project-logos/seata.png",
        source: "ant",
        role: {
          en: "Cross-system transactions, compensation, and failure recovery",
          zh: "跨系统事务、补偿与失败恢复",
        },
        signal: "Ant deep participation · Incubating",
      },
    ],
  },
];

export function getApacheBackbone(lang: Locale) {
  return apacheBackboneSource.map((stage) => ({
    label: stage.label,
    title: pick(lang, stage.title),
    projects: stage.projects.map((project) => ({
      ...project,
      role: pick(lang, project.role),
    })) as ResolvedApacheProject[],
  }));
}
