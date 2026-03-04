import type { ImageComponentProps } from '@/types/ImageComponentProps'
import type { ShapeComponentProps } from '@/types/ShapeComponentProps'
import type { TextComponentProps } from '@/types/TextComponentProps'

export type AllComponentProps = TextComponentProps & ImageComponentProps & ShapeComponentProps
export type AllFormProps = PageProps & AllComponentProps

export interface EditorProps {
  // 供中间编译器渲染的数组
  components: ComponentData[];
  // 当前选中的元素 uuid
  currentElement: string;
  page: PageData;
  // 当前被复制的组件
  copiedComponent?: ComponentData;
  // 当前操作的历史记录
  histories: HistoryRecord[];
  // 当前历史记录的操作位置
  historyIndex: number;
  // 开始更新时的缓存值
  // cachedOldValues: any;
  // 保存最多历史条目记录数
  maxHistoryNumber: number;
  // 数据是否有修改
  isDirty: boolean;
  // 当前作品ID
  workId?: string;
}
export interface ComponentData {
  // id，uuid v4 生成
  id: string;
  // 业务组件库名称 l-text，l-image 等等 
  name: string;
  // 这个元素的 属性，
  props: Partial<AllComponentProps>;
  page?: PageData;
  // 图层名称
  // 是否是根组件
  isRoot?: boolean;
  layerName?: string;
  // 图层是否隐藏
  isHidden?: boolean;
  // 图层是否锁定
  isLocked?: boolean;
}
export interface HistoryRecord {
  id: string;
  componentId: string;
  type: 'add' | 'delete' | 'modify';
  data: any;
  index?: number;
}
export interface PageData {
  id?: number | string;
  props?: PageProps;
  title?: string;
  desc?: string;
  coverImg?: string;
  uuid?: string;
  setting?: Record<string, any>;
  isTemplate?: boolean;
  isHot?: boolean;
  isNew?: boolean;
  author?: string;
  copiedCount?: number;
  status?: number;
  user?: {
    gender: string;
    nickName: string;
    picture: string;
    userName: string;
  };
  templateId?: string;
}

export interface PageProps {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  height?: string;
}