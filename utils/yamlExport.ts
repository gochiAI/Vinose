import JSZip from 'jszip';
import yaml from 'js-yaml';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { ProjectData, Scene, Character, Location, Item, Relationship, Asset, Variable, Memo, Task, Plot, Group, EventType } from '../types';

/**
 * プロジェクトデータをYAML形式のテキストファイル群としてエクスポート
 * フォルダ構造で整理されたZIPファイルを生成
 */
export async function exportProjectAsYamlZip(projectData: ProjectData): Promise<Blob> {
  const zip = new JSZip();

  // ルートにプロジェクト情報
  const projectInfo = {
    projectName: projectData.projectName,
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  };
  zip.file('project.yml', yaml.dump(projectInfo));

  // キャラクターフォルダ
  if (projectData.characters.length > 0) {
    const charactersFolder = zip.folder('characters');
    projectData.characters.forEach((character) => {
      const charData = {
        id: character.id,
        name: character.name,
        description: character.description,
        properties: character.properties,
      };
      charactersFolder?.file(`${sanitizeFileName(character.name)}.yml`, yaml.dump(charData));
    });
  }

  // ロケーションフォルダ
  if (projectData.locations.length > 0) {
    const locationsFolder = zip.folder('locations');
    projectData.locations.forEach((location) => {
      const locData = {
        id: location.id,
        name: location.name,
        description: location.description,
        properties: location.properties,
      };
      locationsFolder?.file(`${sanitizeFileName(location.name)}.yml`, yaml.dump(locData));
    });
  }

  // アイテムフォルダ
  if (projectData.items.length > 0) {
    const itemsFolder = zip.folder('items');
    projectData.items.forEach((item) => {
      const itemData = {
        id: item.id,
        name: item.name,
        description: item.description,
        properties: item.properties,
      };
      itemsFolder?.file(`${sanitizeFileName(item.name)}.yml`, yaml.dump(itemData));
    });
  }

  // シナリオフォルダ
  if (projectData.scenes.length > 0) {
    const scenariosFolder = zip.folder('scenarios');
    projectData.scenes.forEach((scene, index) => {
      const sceneData = {
        id: scene.id,
        title: scene.title,
        plotId: scene.plotId,
        groupId: scene.groupId,
        events: scene.events.map((event) => {
          const baseEvent: any = {
            id: event.id,
            type: EventType[event.type],
          };

          switch (event.type) {
            case EventType.DIALOGUE:
              return {
                ...baseEvent,
                characterId: event.characterId,
                text: event.text,
                spriteAssetId: event.spriteAssetId,
                sfxAssetId: event.sfxAssetId,
                postExecutionActions: event.postExecutionActions,
              };
            case EventType.ACTION:
              return {
                ...baseEvent,
                description: event.description,
                sfxAssetId: event.sfxAssetId,
                postExecutionActions: event.postExecutionActions,
              };
            case EventType.BACKGROUND_CHANGE:
              return {
                ...baseEvent,
                backgroundAssetId: event.backgroundAssetId,
              };
            case EventType.GOTO_SCENE:
              return {
                ...baseEvent,
                nextSceneId: event.nextSceneId,
              };
            case EventType.BRANCH:
              return {
                ...baseEvent,
                mode: event.mode,
                choices: event.choices,
                branches: event.branches,
              };
            case EventType.SFX:
              return {
                ...baseEvent,
                sfxAssetId: event.sfxAssetId,
              };
            default:
              return baseEvent;
          }
        }),
      };
      const fileName = `${String(index + 1).padStart(3, '0')}_${sanitizeFileName(scene.title)}.yml`;
      scenariosFolder?.file(fileName, yaml.dump(sceneData));
    });
  }

  // 関係性フォルダ
  if (projectData.relationships.length > 0) {
    const relationshipsData = {
      relationships: projectData.relationships.map((rel) => ({
        id: rel.id,
        sourceCharacterId: rel.sourceCharacterId,
        targetCharacterId: rel.targetCharacterId,
        type: rel.type,
      })),
    };
    zip.file('relationships.yml', yaml.dump(relationshipsData));
  }

  // アセットフォルダ
  if (projectData.assets.length > 0) {
    const assetsFolder = zip.folder('assets');
    const assetsData = {
      assets: projectData.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        mimeType: asset.mimeType,
        dataPreview: asset.data.substring(0, 100) + '...(省略)',
      })),
    };
    assetsFolder?.file('assets_list.yml', yaml.dump(assetsData));
  }

  // 変数フォルダ
  if (projectData.variables.length > 0) {
    const variablesData = {
      variables: projectData.variables.map((variable) => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        initialValue: variable.initialValue,
      })),
    };
    zip.file('variables.yml', yaml.dump(variablesData));
  }

  // メモフォルダ
  if (projectData.memos.length > 0) {
    const memosFolder = zip.folder('memos');
    projectData.memos.forEach((memo) => {
      const memoData = {
        id: memo.id,
        title: memo.title,
        content: memo.content,
        properties: memo.properties,
      };
      memosFolder?.file(`${sanitizeFileName(memo.title)}.yml`, yaml.dump(memoData));
    });
  }

  // タスクフォルダ
  if (projectData.tasks.length > 0) {
    const tasksData = {
      tasks: projectData.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
      })),
    };
    zip.file('tasks.yml', yaml.dump(tasksData));
  }

  // プロットフォルダ
  if (projectData.plots.length > 0) {
    const plotsFolder = zip.folder('plots');
    projectData.plots.forEach((plot) => {
      const plotData = {
        id: plot.id,
        title: plot.title,
        content: plot.content,
        properties: plot.properties,
      };
      plotsFolder?.file(`${sanitizeFileName(plot.title)}.yml`, yaml.dump(plotData));
    });
  }

  // グループフォルダ
  if (projectData.groups.length > 0) {
    const groupsData = {
      groups: projectData.groups.map((group) => ({
        id: group.id,
        title: group.title,
        color: group.color,
      })),
    };
    zip.file('groups.yml', yaml.dump(groupsData));
  }

  // README追加
  const readme = `# ${projectData.projectName}

このZIPファイルには、プロジェクトのデータがYAML形式で格納されています。

## フォルダ構造

- project.yml: プロジェクト基本情報
- characters/: キャラクター定義
- locations/: ロケーション定義
- items/: アイテム定義
- scenarios/: シナリオ（シーン）
- assets/: アセット一覧
- relationships.yml: キャラクター関係性
- variables.yml: 変数定義
- memos/: メモ
- tasks.yml: タスク一覧
- plots/: プロット
- groups.yml: グループ定義

エクスポート日時: ${new Date().toLocaleString()}
`;
  zip.file('README.md', readme);

  // ZIP生成
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * ファイル名として使えるように文字列をサニタイズ
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // 禁止文字を_に置換
    .replace(/\s+/g, '_') // 空白を_に置換
    .substring(0, 100); // 長さ制限
}

/**
 * シナリオをDOCX形式でエクスポート
 */
export async function exportScenarioAsDOCX(projectData: ProjectData): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

  const paragraphs: any[] = [];

  // タイトル
  paragraphs.push(
    new Paragraph({
      text: projectData.projectName,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // 各シーン
  projectData.scenes.forEach((scene, sceneIndex) => {
    // シーンタイトル
    paragraphs.push(
      new Paragraph({
        text: `シーン ${sceneIndex + 1}: ${scene.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    // イベント処理
    scene.events.forEach((event, eventIndex) => {
      let eventParagraphs: any[] = [];

      switch (event.type) {
        case EventType.DIALOGUE: {
          // キャラクター名を取得
          const character = projectData.characters.find(
            (c) => c.id === event.characterId
          );
          const characterName = character?.name || '不明';

          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${characterName}：`,
                  bold: true,
                }),
                new TextRun(event.text),
              ],
              spacing: { after: 200 },
            })
          );
          break;
        }
        case EventType.ACTION:
          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '【アクション】',
                  bold: true,
                  italics: true,
                }),
                new TextRun(event.description),
              ],
              spacing: { after: 200 },
            })
          );
          break;
        case EventType.BACKGROUND_CHANGE: {
          const asset = projectData.assets.find(
            (a) => a.id === event.backgroundAssetId
          );
          const assetName = asset?.name || '不明';

          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `【背景変更: ${assetName}】`,
                  bold: true,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            })
          );
          break;
        }
        case EventType.BRANCH: {
          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '【分岐】',
                  bold: true,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          );

          event.choices?.forEach((choice) => {
            eventParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `→ ${choice.text}`,
                  }),
                ],
                spacing: { before: 50, after: 50 },
              })
            );
          });
          break;
        }
        case EventType.GOTO_SCENE: {
          const targetScene = projectData.scenes.find(
            (s) => s.id === event.nextSceneId
          );
          const sceneName = targetScene?.title || '不明';

          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `【シーン遷移: ${sceneName}】`,
                  bold: true,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            })
          );
          break;
        }
        case EventType.SFX: {
          const asset = projectData.assets.find(
            (a) => a.id === event.sfxAssetId
          );
          const assetName = asset?.name || '不明';

          eventParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `【効果音: ${assetName}】`,
                  bold: true,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            })
          );
          break;
        }
      }

      paragraphs.push(...eventParagraphs);
    });

    // シーン間のスペーサー
    if (sceneIndex < projectData.scenes.length - 1) {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 },
        })
      );
    }
  });

  // ドキュメント作成
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // DOCX生成
  const blob = await Packer.toBlob(doc);
  return blob;
}
