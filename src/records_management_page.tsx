import {useState} from "react"
import jsPDF from "jspdf"
// @ts-ignore
import notoFont from './fonts/NotoSansJP-Black-normal.js';
import autoTable from "jspdf-autotable"


// shadcn/ui 的一些组件示例，具体请以你项目实际情况（版本、路径等）为准
import {Button} from "./components/ui/button"
import {Table, TableBody, TableCell, TableHeader, TableRow} from "./components/ui/table"
import {
  Popover,
  PopoverTrigger,
  PopoverContent, 
} from "./components/ui/popover"
import {Input} from "./components/ui/input"
import {Calendar} from "./components/ui/calendar"
import {CalendarIcon, PlusCircle} from "lucide-react"
import {format, parse} from "date-fns"

// ----------------- 数据类型定义 -----------------
interface RecordItem {
  id: number
  date: string
  time: string
  symptom: string  // 症状（字符串形式）
  medicine: string
}

// 将每个症状配置为一个对象，便于灵活扩展
// key：内部识别用，用于选中或取消
// label：展示给用户的文字
// withTemp：标识该选项是否需要额外填写温度
const SYMPTOM_OPTIONS = [
  {key: "fever", label: "熱（最高体温　　℃）", withTemp: true},
  {key: "鼻水", label: "鼻水", withTemp: false},
  {key: "せき", label: "せき", withTemp: false},
  {key: "のどの痛み", label: "のどの痛み", withTemp: false},
  {key: "ゼイゼイする", label: "ゼイゼイする", withTemp: false},
  {key: "耳の痛み", label: "耳の痛み", withTemp: false},
  {key: "目やに", label: "目やに", withTemp: false},
  {key: "頭痛", label: "頭痛", withTemp: false},
  {key: "腹痛", label: "腹痛", withTemp: false},
  {key: "吐き気・嘔吐", label: "吐き気・嘔吐", withTemp: false},
  {key: "便秘", label: "便秘", withTemp: false},
  {key: "下痢", label: "下痢", withTemp: false},
  {key: "発疹", label: "発疹", withTemp: false},
]

// ----------------- 日期选择组件 -----------------
interface DatePickerInputProps {
  dateString: string
  onChange: (value: string) => void
  placeholder?: string
}

function DatePickerInput({
                           dateString,
                           onChange,
                           placeholder = "请选择/输入日期",
                         }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)

  const parsedDate = dateString
    ? parse(dateString, "yyyy-MM-dd", new Date())
    : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    const formatted = format(selectedDate, "yyyy-MM-dd")
    onChange(formatted)
  }

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">
            <Input
              value={dateString}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)}
              className="pr-10"
            />
            <CalendarIcon
              className="ml-[-28px] h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setOpen((prev) => !prev)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ----------------- 症状多选 + “熱”温度输入组件 -----------------
interface SymptomMultiSelectProps {
  value: string
  onChange: (val: string) => void
}

function SymptomMultiSelect({value, onChange}: SymptomMultiSelectProps) {
  // 父组件传进来的 symptom 用逗号切分，转换为一组选中的 key（如果存在）
  // 但实际场景中，如果希望精确回显每个选项，可在父组件中使用 JSON、数组等形式存储
  const initialValues: string[] = []
  const [open, setOpen] = useState(false)

  // 当前被选中的 key 列表
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialValues)
  // 给“熱”专门准备一个温度值
  const [tempValue, setTempValue] = useState("")

  // 自定义手动输入的其他症状
  const [customSymptom, setCustomSymptom] = useState("")

  // 当选中或取消某一选项时
  const handleToggle = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        // 如果已经选中则取消
        // 若取消了“fever”，则清空温度输入
        if (key === "fever") {
          setTempValue("")
        }
        return prev.filter((x) => x !== key)
      } else {
        // 未选中则加入
        return [...prev, key]
      }
    })
  }

  // 点击“确定”后，将多选结果 + 温度 + 自定义输入 拼接到一起
  const handleConfirm = () => {
    const finalList: string[] = []

    // 逐一检查 SYMPTOM_OPTIONS
    SYMPTOM_OPTIONS.forEach((option) => {
      if (selectedKeys.includes(option.key)) {
        // 如果是带温度的“熱”
        if (option.withTemp) {
          // 如果没填温度，可自行决定是否提醒或使用默认值
          // 这里演示简单拼接
          const feverLabel = `熱（最高体温 ${tempValue || "未填写"}℃）`
          finalList.push(feverLabel)
        } else {
          // 普通选项
          finalList.push(option.label)
        }
      }
    })

    // 如果有手动输入的其他症状
    if (customSymptom.trim()) {
      finalList.push(customSymptom.trim())
    }

    // 拼成一个字符串，传回父组件
    onChange(finalList.join(", "))
    setOpen(false)
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">
            <Input
              readOnly
              value={value}
              placeholder="症状"
              className="pr-10 cursor-pointer"
              onClick={() => setOpen(true)}
            />
            <PlusCircle
              className="ml-[-28px] h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setOpen((prev) => !prev)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-2 max-w-xs">
          <div className="mb-2 font-semibold">症状选择：</div>
          <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
            {SYMPTOM_OPTIONS.map((option) => {
              const checked = selectedKeys.includes(option.key)
              return (
                <div key={option.key} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(option.key)}
                      className="cursor-pointer"
                    />
                    <label className="cursor-pointer">{option.label}</label>
                  </div>
                  {/* 如果是“熱”并且已选中，则显示温度输入框 */}
                  {option.withTemp && checked && (
                    <div className="ml-6 mt-1">
                      <Input
                        placeholder="请填写体温（例如 38.5）"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="font-semibold mb-1">其他症状（手动输入）：</div>
          <Input
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            placeholder="可在此输入其他症状"
          />

          <Button onClick={handleConfirm} className="mt-2 w-full">
            确定
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ----------------- 主页面示例 -----------------
export default function RecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [currentId, setCurrentId] = useState(1)

  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [symptom, setSymptom] = useState("")   // 接收多选/拼接过的症状
  const [medicine, setMedicine] = useState("")

  // 添加一条病历记录
  const handleAddRecord = () => {
    // 判断日期是否为空
    if (!date.trim()) {
      alert("日期不能为空，请选择或输入日期。")
      return
    }

    const newRecord: RecordItem = {
      id: currentId,
      date,
      time,
      symptom,
      medicine,
    }
    setRecords((prev) => [...prev, newRecord])
    setCurrentId(currentId + 1)

    // 清空输入
    setDate("")
    setTime("")
    setSymptom("")
    setMedicine("")
  }

  // 删除指定记录
  const handleDeleteRecord = (id: number) => {
    setRecords((prev) => prev.filter((item) => item.id !== id))
  }

  // 导出 PDF
  // 这是我们转换出来的 base64 字体文件

  const handleGeneratePDF = () => {
    const doc = new jsPDF()

    // 1. 注册自定义字体（包含日文/中文）
    doc.addFileToVFS("NotoSansJP-Black.ttf", notoFont)
    doc.addFont("NotoSansJP-Black.ttf", "NotoSansJP-Black", "normal")
    doc.setFont("NotoSansJP-Black", "normal") // 设置当前字体

    // 2. 输出标题
    doc.setFontSize(14)
    doc.text("こどもの通院記録（孩子看病记录）", 10, 10)

    // 3. 生成表格
    // head 代表表头，body 代表数据
    // 需要注意的是, jsPDF 的默认坐标原点都在左上角, 如果标题文字会跟表格重叠, 可以让 autoTable 往下留一定距离
    autoTable(doc, {
      startY: 20, // 表格开始绘制的 y 位置，避免跟标题重叠
      head: [["日付", "時間", "症状", "薬"]], // 表头 (日语)
      body: records.map((record) => [
        record.date,
        record.time,
        record.symptom,
        record.medicine,
      ]),
      styles: {
        font: "NotoSansJP-Black", // 指定我们注册的字体名称
        fontStyle: "normal",      // 字体样式
        fontSize: 12,
      },
      headStyles: {
        fillColor: [220, 220, 220], // 表头背景色 (灰色)
        textColor: 20,             // 表头文字颜色
      },
    })

    // 4. 下载生成好的 PDF
    doc.save("records.pdf")
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">孩子生病记录</h1>

      <div className="flex flex-col gap-2 w-full max-w-sm mb-4">
        {/* 日期选择 */}
        <DatePickerInput
          dateString={date}
          onChange={setDate}
          placeholder="日期（YYYY-MM-DD）"
        />

        {/* 时间：使用原生 type='time' */}
        <Input
          type="time"
          placeholder="时间（如：08:00）"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        {/* 症状组件：多选 + "熱"温度输入 */}
        <SymptomMultiSelect value={symptom} onChange={setSymptom}/>

        {/* 用药 */}
        <Input
          placeholder="用药"
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
        />

        <Button onClick={handleAddRecord}>添加记录</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>日期</TableCell>
            <TableCell>时间</TableCell>
            <TableCell>症状</TableCell>
            <TableCell>用药</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.time}</TableCell>
              <TableCell>{r.symptom}</TableCell>
              <TableCell>{r.medicine}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteRecord(r.id)}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {records.length > 0 && (
        <Button className="mt-4" onClick={handleGeneratePDF}>
          导出 PDF
        </Button>
      )}
    </div>
  )
}
