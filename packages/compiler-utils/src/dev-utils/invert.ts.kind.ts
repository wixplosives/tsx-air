import ts from 'typescript';

export const tsKindInverse: Record<ts.SyntaxKind, string> = {
    0: 'Unknown',
    1: 'EndOfFileToken',
    2: 'SingleLineCommentTrivia',
    3: 'MultiLineCommentTrivia',
    4: 'NewLineTrivia',
    5: 'WhitespaceTrivia',
    6: 'ShebangTrivia',
    7: 'ConflictMarkerTrivia',
    8: 'NumericLiteral',
    9: 'BigIntLiteral',
    10: 'StringLiteral',
    11: 'JsxText',
    12: 'JsxTextAllWhiteSpaces',
    13: 'RegularExpressionLiteral',
    14: 'NoSubstitutionTemplateLiteral',
    15: 'TemplateHead',
    16: 'TemplateMiddle',
    17: 'TemplateTail',
    18: 'OpenBraceToken',
    19: 'CloseBraceToken',
    20: 'OpenParenToken',
    21: 'CloseParenToken',
    22: 'OpenBracketToken',
    23: 'CloseBracketToken',
    24: 'DotToken',
    25: 'DotDotDotToken',
    26: 'SemicolonToken',
    27: 'CommaToken',
    28: 'QuestionDotToken',
    29: 'LessThanToken',
    30: 'LessThanSlashToken',
    31: 'GreaterThanToken',
    32: 'LessThanEqualsToken',
    33: 'GreaterThanEqualsToken',
    34: 'EqualsEqualsToken',
    35: 'ExclamationEqualsToken',
    36: 'EqualsEqualsEqualsToken',
    37: 'ExclamationEqualsEqualsToken',
    38: 'EqualsGreaterThanToken',
    39: 'PlusToken',
    40: 'MinusToken',
    41: 'AsteriskToken',
    42: 'AsteriskAsteriskToken',
    43: 'SlashToken',
    44: 'PercentToken',
    45: 'PlusPlusToken',
    46: 'MinusMinusToken',
    47: 'LessThanLessThanToken',
    48: 'GreaterThanGreaterThanToken',
    49: 'GreaterThanGreaterThanGreaterThanToken',
    50: 'AmpersandToken',
    51: 'BarToken',
    52: 'CaretToken',
    53: 'ExclamationToken',
    54: 'TildeToken',
    55: 'AmpersandAmpersandToken',
    56: 'BarBarToken',
    57: 'QuestionToken',
    58: 'ColonToken',
    59: 'AtToken',
    60: 'QuestionQuestionToken',
    61: 'BacktickToken',
    62: 'EqualsToken',
    63: 'PlusEqualsToken',
    64: 'MinusEqualsToken',
    65: 'AsteriskEqualsToken',
    66: 'AsteriskAsteriskEqualsToken',
    67: 'SlashEqualsToken',
    68: 'PercentEqualsToken',
    69: 'LessThanLessThanEqualsToken',
    70: 'GreaterThanGreaterThanEqualsToken',
    71: 'GreaterThanGreaterThanGreaterThanEqualsToken',
    72: 'AmpersandEqualsToken',
    73: 'BarEqualsToken',
    74: 'CaretEqualsToken',
    75: 'Identifier',
    76: 'BreakKeyword',
    77: 'CaseKeyword',
    78: 'CatchKeyword',
    79: 'ClassKeyword',
    80: 'ConstKeyword',
    81: 'ContinueKeyword',
    82: 'DebuggerKeyword',
    83: 'DefaultKeyword',
    84: 'DeleteKeyword',
    85: 'DoKeyword',
    86: 'ElseKeyword',
    87: 'EnumKeyword',
    88: 'ExportKeyword',
    89: 'ExtendsKeyword',
    90: 'FalseKeyword',
    91: 'FinallyKeyword',
    92: 'ForKeyword',
    93: 'FunctionKeyword',
    94: 'IfKeyword',
    95: 'ImportKeyword',
    96: 'InKeyword',
    97: 'InstanceOfKeyword',
    98: 'NewKeyword',
    99: 'NullKeyword',
    100: 'ReturnKeyword',
    101: 'SuperKeyword',
    102: 'SwitchKeyword',
    103: 'ThisKeyword',
    104: 'ThrowKeyword',
    105: 'TrueKeyword',
    106: 'TryKeyword',
    107: 'TypeOfKeyword',
    108: 'VarKeyword',
    109: 'VoidKeyword',
    110: 'WhileKeyword',
    111: 'WithKeyword',
    112: 'ImplementsKeyword',
    113: 'InterfaceKeyword',
    114: 'LetKeyword',
    115: 'PackageKeyword',
    116: 'PrivateKeyword',
    117: 'ProtectedKeyword',
    118: 'PublicKeyword',
    119: 'StaticKeyword',
    120: 'YieldKeyword',
    121: 'AbstractKeyword',
    122: 'AsKeyword',
    123: 'AssertsKeyword',
    124: 'AnyKeyword',
    125: 'AsyncKeyword',
    126: 'AwaitKeyword',
    127: 'BooleanKeyword',
    128: 'ConstructorKeyword',
    129: 'DeclareKeyword',
    130: 'GetKeyword',
    131: 'InferKeyword',
    132: 'IsKeyword',
    133: 'KeyOfKeyword',
    134: 'ModuleKeyword',
    135: 'NamespaceKeyword',
    136: 'NeverKeyword',
    137: 'ReadonlyKeyword',
    138: 'RequireKeyword',
    139: 'NumberKeyword',
    140: 'ObjectKeyword',
    141: 'SetKeyword',
    142: 'StringKeyword',
    143: 'SymbolKeyword',
    144: 'TypeKeyword',
    145: 'UndefinedKeyword',
    146: 'UniqueKeyword',
    147: 'UnknownKeyword',
    148: 'FromKeyword',
    149: 'GlobalKeyword',
    150: 'BigIntKeyword',
    151: 'OfKeyword',
    152: 'QualifiedName',
    153: 'ComputedPropertyName',
    154: 'TypeParameter',
    155: 'Parameter',
    156: 'Decorator',
    157: 'PropertySignature',
    158: 'PropertyDeclaration',
    159: 'MethodSignature',
    160: 'MethodDeclaration',
    161: 'Constructor',
    162: 'GetAccessor',
    163: 'SetAccessor',
    164: 'CallSignature',
    165: 'ConstructSignature',
    166: 'IndexSignature',
    167: 'TypePredicate',
    168: 'TypeReference',
    169: 'FunctionType',
    170: 'ConstructorType',
    171: 'TypeQuery',
    172: 'TypeLiteral',
    173: 'ArrayType',
    174: 'TupleType',
    175: 'OptionalType',
    176: 'RestType',
    177: 'UnionType',
    178: 'IntersectionType',
    179: 'ConditionalType',
    180: 'InferType',
    181: 'ParenthesizedType',
    182: 'ThisType',
    183: 'TypeOperator',
    184: 'IndexedAccessType',
    185: 'MappedType',
    186: 'LiteralType',
    187: 'ImportType',
    188: 'ObjectBindingPattern',
    189: 'ArrayBindingPattern',
    190: 'BindingElement',
    191: 'ArrayLiteralExpression',
    192: 'ObjectLiteralExpression',
    193: 'PropertyAccessExpression',
    194: 'ElementAccessExpression',
    195: 'CallExpression',
    196: 'NewExpression',
    197: 'TaggedTemplateExpression',
    198: 'TypeAssertionExpression',
    199: 'ParenthesizedExpression',
    200: 'FunctionExpression',
    201: 'ArrowFunction',
    202: 'DeleteExpression',
    203: 'TypeOfExpression',
    204: 'VoidExpression',
    205: 'AwaitExpression',
    206: 'PrefixUnaryExpression',
    207: 'PostfixUnaryExpression',
    208: 'BinaryExpression',
    209: 'ConditionalExpression',
    210: 'TemplateExpression',
    211: 'YieldExpression',
    212: 'SpreadElement',
    213: 'ClassExpression',
    214: 'OmittedExpression',
    215: 'ExpressionWithTypeArguments',
    216: 'AsExpression',
    217: 'NonNullExpression',
    218: 'MetaProperty',
    219: 'SyntheticExpression',
    220: 'TemplateSpan',
    221: 'SemicolonClassElement',
    222: 'Block',
    223: 'EmptyStatement',
    224: 'VariableStatement',
    225: 'ExpressionStatement',
    226: 'IfStatement',
    227: 'DoStatement',
    228: 'WhileStatement',
    229: 'ForStatement',
    230: 'ForInStatement',
    231: 'ForOfStatement',
    232: 'ContinueStatement',
    233: 'BreakStatement',
    234: 'ReturnStatement',
    235: 'WithStatement',
    236: 'SwitchStatement',
    237: 'LabeledStatement',
    238: 'ThrowStatement',
    239: 'TryStatement',
    240: 'DebuggerStatement',
    241: 'VariableDeclaration',
    242: 'VariableDeclarationList',
    243: 'FunctionDeclaration',
    244: 'ClassDeclaration',
    245: 'InterfaceDeclaration',
    246: 'TypeAliasDeclaration',
    247: 'EnumDeclaration',
    248: 'ModuleDeclaration',
    249: 'ModuleBlock',
    250: 'CaseBlock',
    251: 'NamespaceExportDeclaration',
    252: 'ImportEqualsDeclaration',
    253: 'ImportDeclaration',
    254: 'ImportClause',
    255: 'NamespaceImport',
    256: 'NamedImports',
    257: 'ImportSpecifier',
    258: 'ExportAssignment',
    259: 'ExportDeclaration',
    260: 'NamedExports',
    261: 'ExportSpecifier',
    262: 'MissingDeclaration',
    263: 'ExternalModuleReference',
    264: 'JsxElement',
    265: 'JsxSelfClosingElement',
    266: 'JsxOpeningElement',
    267: 'JsxClosingElement',
    268: 'JsxFragment',
    269: 'JsxOpeningFragment',
    270: 'JsxClosingFragment',
    271: 'JsxAttribute',
    272: 'JsxAttributes',
    273: 'JsxSpreadAttribute',
    274: 'JsxExpression',
    275: 'CaseClause',
    276: 'DefaultClause',
    277: 'HeritageClause',
    278: 'CatchClause',
    279: 'PropertyAssignment',
    280: 'ShorthandPropertyAssignment',
    281: 'SpreadAssignment',
    282: 'EnumMember',
    283: 'UnparsedPrologue',
    284: 'UnparsedPrepend',
    285: 'UnparsedText',
    286: 'UnparsedInternalText',
    287: 'UnparsedSyntheticReference',
    288: 'SourceFile',
    289: 'Bundle',
    290: 'UnparsedSource',
    291: 'InputFiles',
    292: 'JSDocTypeExpression',
    293: 'JSDocAllType',
    294: 'JSDocUnknownType',
    295: 'JSDocNullableType',
    296: 'JSDocNonNullableType',
    297: 'JSDocOptionalType',
    298: 'JSDocFunctionType',
    299: 'JSDocVariadicType',
    300: 'JSDocNamepathType',
    301: 'JSDocComment',
    302: 'JSDocTypeLiteral',
    303: 'JSDocSignature',
    304: 'JSDocTag',
    305: 'JSDocAugmentsTag',
    306: 'JSDocAuthorTag',
    307: 'JSDocClassTag',
    308: 'JSDocCallbackTag',
    309: 'JSDocEnumTag',
    310: 'JSDocParameterTag',
    311: 'JSDocReturnTag',
    312: 'JSDocThisTag',
    313: 'JSDocTypeTag',
    314: 'JSDocTemplateTag',
    315: 'JSDocTypedefTag',
    316: 'JSDocPropertyTag',
    317: 'SyntaxList',
    318: 'NotEmittedStatement',
    319: 'PartiallyEmittedExpression',
    320: 'CommaListExpression',
    321: 'MergeDeclarationMarker',
    322: 'EndOfDeclarationMarker',
    323: 'SyntheticReferenceExpression',
    324: 'Count',
};