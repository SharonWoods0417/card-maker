# Oxford Phonics 拼读拆分规则文档（自然拼读教学专用）

版本：v2.7  
适用范围：6–10 岁儿童英语拼读教学、词汇卡片拆分、发音辅助训练

---

## ✳️ 拆分目标：拼读块 = 音素块（Phonics = Phonemes）

本规则旨在将英文单词拆分为可视化拼读块（phonics chunks），其依据为：
- **拼读块必须对应至少一个音素（phoneme）**
- **拼读结构应尽可能与标准发音（IPA）一致**
- **每个拼读块构成一个自然发音单位，利于朗读和记忆**

---

## ✅ 拼读拆分总则

### 🔹 原则一：音素映射对齐
1. 每个拼读块应尽量与一个或一组连续音素对应
2. 拆分结果的音素数量 ≈ 单词的实际发音音素数
3. 避免拆断单一音素结构（如 /f/ 不能拆成 `p + h`）

---

### 🔹 原则二：不可拆组合保护（Protected Chunks）

#### 🔸 Digraphs & Trigraphs（辅音组合）
- `ch`, `sh`, `th`, `ph`, `wh`, `ck`, `ng`, `gh`, `tch`, `dge`, `wr`, `kn`, `gn`, `qu`, `squ`

#### 🔸 Vowel Teams（元音组合）
- `ai`, `ay`, `ee`, `ea`, `oa`, `oo`, `ue`, `ew`, `ie`, `igh`, `ou`, `ow`, `oy`, `oi`, `ey`, `ui`

#### 🔸 R-controlled vowels
- `ar`, `er`, `ir`, `or`, `ur`, `air`, `are`, `ear`, `ere`, `eir`

#### 🔸 Magic-e结构（不可分离）
- `a-e`, `i-e`, `o-e`, `u-e`, `e-e` 保持整体，表示长元音发音

#### 🔸 Final Stable Syllables（结尾结构）
- `-le`, `-tion`, `-sion`, `-ture`, `-cian`, `-sure`, `-age`, `-dge`

---

### 🔹 原则三：语音优先级 > 音节结构

- 拆分应以发音结构为主，不以书面音节为拆分依据
- 示例：`Monday` → `m - on - d - ay`（不是 `mon - day`）

---

### 🔹 原则四：拼读块构建方法

按以下顺序构建拼读块：
1. 匹配例外词（如 one, done, does）
2. 拆出前缀/后缀（如 re-, un-, -ing, -less）
3. 保留不可拆组合（digraphs, vowel teams, magic-e）
4. 拆成符合发音规律的单元音 / 单辅音组合
5. 参考音标（IPA）确保音素数量基本一致

---

## 🆕 v2.7 拓展规则（新增修正）

### 🔸 起始组合保护
以下组合如出现在词首或重读音节中，应整体保留为拼读块，避免误拆：
- `el`, `em`, `en`（如 elephant, elbow, empty）

### 🔸 Digraph 独立性优先
如 digraph（如 `ph`, `gh`, `sh`）被夹在两个块之间，必须优先拆出独立拼读块，防止误断：
- ❌ 错误示例：lep-han-t（elephant）
- ✅ 正确示例：el-e-ph-ant

---

## 🧠 拆分 + 音标 示例（更新后）

| 单词       | 拆分块           | 音标         | 映射说明                    |
|------------|------------------|--------------|-----------------------------|
| **elephant**| el-e-ph-ant      | /ˈɛləfənt/   | `el`起始保护, `ph`→/f/, `ant`→/ænt/ |
| **empty**   | em-p-t-y         | /ˈɛmpti/     | `em`起始保护               |
| **energy**  | en-er-g-y        | /ˈɛnədʒi/    | `en`起始保护, `er`→/ər/     |
| **phone**   | ph-o-n-e         | /fəʊn/       | `ph`→/f/, `o-e`→/əʊ/        |
| **graph**   | gr-a-ph          | /grɑːf/      | `ph`独立成块               |
| **circle**  | c-ir-c-le        | /ˈsɜːkəl/     | `ir`→/ɜː/, `le`→/əl/        |
| **science** | sc-i-e-n-ce      | /ˈsaɪəns/     | `sc`→/s/, `ie`→/aɪə/        |

---

## ✅ 建议应用方式

- 用于英语拼读教学卡片生成
- 支持教学软件词块识别系统
- 结合发音词典可进行拆分准确性比对

---

## 🟡 附录：常见发音与拼写不一致词（建议例外处理）

### 整体处理词汇
- `one`, `two`, `done`, `gone`, `some`, `come`
- `what`, `who`, `where`, `when`, `why`
- `said`, `have`, `again`, `any`, `been`
- `are`, `were`, `was`, `does`

请使用例外词表或人工指定拆分方式。

---

## 📋 v2.7 更新说明

### 新增特性
1. **起始组合保护**：`el/em/en` 在词首整体保留
2. **Digraph独立性优先**：确保 `ph/gh/sh` 等独立成块
3. **完善例外词库**：覆盖更多发音不规则词汇

### 修正问题
- 解决 `elephant` 误拆为 `e-lep-han-t` 的问题
- 优化前缀识别逻辑，避免与起始组合冲突
- 提升音素映射对齐准确性

---

此规则文档适用于教学、练习、评估及应用开发。建议结合语音识别或词典支持，提高自动拆分准确性。 