var fs = require('fs');
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');           // Message 异常提醒
var less = require('gulp-less');                 //scss
var autoprefixer = require('autoprefixer-core'); // 浏览器前缀
var gulp_postcss = require('gulp-postcss');       // Postcss  预编译
var rename = require("gulp-rename");             //重命名 LESS 使用
var cssimport = require('postcss-import');       // css import
var nested = require('postcss-nested');
var mqpacker = require('css-mqpacker');           // MQ 包装器
var csswring = require('csswring');               // css minify(压缩)
var sourcemaps   = require('gulp-sourcemaps');   // 信息文件
var cssnano = require('cssnano');
var del = require('del');

var dirs = JSON.parse(fs.readFileSync("./config.conf", 'utf8'));
// 配置
var paths = (function(){
  return {
    src : {
      less : [
        "!"+dirs.src + "/**/mixin/**/**.less",  //不编译目录中有 mixin 的文件
        dirs.src + "/**/**.less",
        dirs.src + "/**/**.css"
      ],
      javascript : [
        dirs.src + "/**/**.js"
      ],
      images : [
        dirs.src + "/**/**.png",
        dirs.src + "/**/**.jpg",
        dirs.src + "/**/**.jpeg",
        dirs.src + "/**/**.mp3",
        dirs.src + "/**/**.mp4"
      ],
      html : [
        dirs.src + "/**/**.html",
        dirs.src + "/**/**.json"
      ]
    },
    dest : dirs.dest
  };
})();

gulp.task('less',function () {
  var processors = [
    cssimport,
    nested,
    mqpacker,
    autoprefixer
  ];
  /**
   * 需要开启css压缩，把下面注释取消即可
   */
  //配置了压缩css
  if(dirs.csswring){
    processors.push(cssnano);
    processors.push(csswring({
      removeAllComments: true
    }));
  }
  return gulp.src(paths.src.less)
    //信息文件
    //压缩后的文件如果报错，不方便查找对应的源文件
    //印上信息文件方便 debug
    .pipe(sourcemaps.init())
    .pipe(
      plumber({
        //代码异常提醒
        errorHandler: notify.onError('Error: <%= error.message %>')
      })
    )
    .pipe(less()) // less 编译;
    .pipe(gulp_postcss(processors))
    .pipe(
      rename({
        extname: ".css" //重命名为 css 文件
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('images', function () {
    //入口文件
    return gulp.src(paths.src.images)
        .pipe(gulp.dest(paths.dest));
});
gulp.task('javascript', function () {
    //入口文件
    return gulp.src(paths.src.javascript)
        .pipe(gulp.dest(paths.dest));
});
gulp.task('html', function () {
    //入口文件
    return gulp.src(paths.src.html)
        .pipe(gulp.dest(paths.dest));
});

gulp.task('build', ['less','javascript','images','html']);

gulp.task('watch', ['build'], function(){
  var reload  = browserSync.reload;  //浏览器自动刷新
  Object.keys(paths.src).map((key) => {
    if(key != 'fonts'){
      var watch = gulp.watch(paths.src[key], [key]);
      if(key == "html"){
        watch.on('change', reload);
      }
    }
  });
});

//删除以前的文件
gulp.task('clean', function(){
    try{
      del.sync([
        paths.dest+"/*"
      ]);
    }
    catch(e){
    }
});

// 静态服务器
gulp.task('browser-server', function() {
  //如何配置了代理
  if(dirs.proxy){
    browserSync.init({
        proxy: dirs.proxy
    });
  }
  else{
    //没有配置代理，者启动静态文件服务
    browserSync.init({
      server: {
          baseDir: paths.dest
      }
    });
  }
});

gulp.task('default',['watch','browser-server']);



