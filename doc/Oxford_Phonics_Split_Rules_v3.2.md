# Oxford Phonics 拼读拆分规则文档（自然拼读教学专用）

版本：v3.2  
适用范围：6–10 岁儿童英语拼读教学、词汇卡片拆分、发音辅助训练

---

## ✅ 核心拆分逻辑流程

### Step 1️⃣：按音节结构初步拆分（Syllable Segmentation）
- 使用音节划分规则（每个音节包含至少一个元音音素）
- 判断主重音、辅音连接方式，切分为 syllables
- 示例：**observe** → `ob - serve`

### Step 2️⃣：标记前缀/后缀（Prefix & Suffix Recognition）
- 如果一个音节是常见构词前缀或后缀，优先识别并独立保留
- 参考结构：
  - **前缀**（Prefix）：
    - 常见功能性：**un-, re-, dis-, mis-, pre-, ex-, in-, im-, ir-, il-, sub-, inter-, over-, under-, trans-, en-, em-, fore-, de-, non-, anti-, auto-, bi-, tri-, co-, con-** 等
  - **后缀**（Suffix）：
    - 动词类变化：**-ing, -ed, -en, -ify, -ize**
    - 形容词类：**-er, -est, -ful, -less, -ous, -ive, -al, -ic, -able, -ible, -y**
    - 名词类：**-ment, -ness, -tion, -sion, -ity, -ty, -ship, -hood, -dom, -ance, -ence, -age, -ist, -or, -er**
    - 副词类：**-ly, -ward, -wise**
- 示例：**building** → `build - ing`

### Step 3️⃣：在每个音节中查表拆分拼读块（Phonics Chunking）
- 使用 Phonics Chart 中的所有组合规则，对每个音节内部进行查表拆解：

#### 🔹 Hard C & G
- **c, g, ge, dge**

#### 🔹 Others（特殊拼写组合）
- **kn, wr, mb, tw, gn, ds**

#### 🔹 Digraphs（双字母组合音）
- **ch / tch, sh, th, wh, ph, gh**

#### 🔹 S blends（s + 辅音组合）
- **sc, sk, st, sp, sm, sn, sl, sw**

#### 🔹 R blends（辅音 + r 组合）
- **br, cr, dr, fr, gr, pr, tr**

#### 🔹 L blends（辅音 + l 组合）
- **bl, cl, fl, gl, pl, sl**

#### 🔹 R Vowels I（R-controlled vowels 第一组）
- **ar, or, ir, ur, er**

#### 🔹 R Vowels II（R-controlled vowels 第二组）
- **air, are, ear, eer, ire, ore, oar**

#### 🔹 Magic E（"魔法 E"结构）
- **a-e, i-e, o-e, u-e, e-e**

#### 🔹 Vowel Teams（元音组合）
- **ai, ay, au, aw, al, ar, are, ere**
- **ee, ea, ey, ei, e_e**
- **ie, igh, ire**
- **oa, ow, oe, o_e, ore**
- **oi, oy**
- **ue, ui, ew**

#### 🔹 Short Vowels（短元音）
- **a, e, i, o, u**

#### 🔹 Word Families（韵母类）
- **an, en, in, on, un**

### Step 4️⃣：应用 CVC 简化规则（CVC Blocking Rule）
- 如果某个音节是经典的 CVC（辅音+元音+辅音）结构，可整体保留不拆
- 示例：**cat**、**pan**、**mix**、**fam** 等

### Step 5️⃣：发音对齐验证（Phoneme Alignment Check）
- 拆分后的拼读块应尽量贴合标准发音（IPA）
- 一个拼读块 ≈ 一个自然音或音组合
- 示例：**hard** → /hɑːd/ → 拼读块应为 `h-ar-d` 而非 `ha-rd`

### Step 6️⃣：拼读块标注与输出（输出结构）
- 输出为：音节边界 + 拼读块边界（例如：h-ar-d, ob-serve, sci-en-tist）
- 可用于教学标注、卡片生成、程序注音标记等

---

## 🔠 示例对照（流程 + 图表规则）

| 单词 | 音节拆分 | 拼读块拆分 | 说明 |
|------|-------------|----------------|-------|
| far | far | f-ar | R-controlled vowel: ar |
| hard | hard | h-ar-d | ar + 尾辅音 d |
| plan | plan | pl-an | l-blend pl + an |
| scientist | sci-en-tist | sci - en - tist | 复合构词，拼读自然结构 |
| observe | ob-serve | ob - s-er-ve | er = R-controlled, ve = 收尾辅音 |
| thirsty | thirst-y | th - ir - st - y | th digraph + ir + st + y ending |
| building | build-ing | b-ui-l-d - ing | ui 属于 vowel team，但此处弱化，可视为整体 + 后缀 ing |
| people | peo - ple | p-eo - p-le | eo 读作 /iː/, ple 为 Final-le结构 |
| air | air | air | R-controlled vowel，整体保留 |

---

## ✅ 注意事项

- 不规则拼写（如 said, one, laugh）另设 sight word 规则处理
- 拼读块拆分不等于视觉字母拆分，始终以发音自然单位为主
- 表格中重复的结构（如 ar/are 在 R-controlled 与 vowel teams 中重复）需结合发音判断使用
- 若结构同时出现在多个类（如 `ore` 属于 magic-e 与 r vowel 结构），需根据发音与词尾位置综合判断

---

如需扩展此规则为程序格式、JSON结构或生成批量拆分，请明确调用模块名与格式输出指令。 