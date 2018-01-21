(function($, window, document, undefined) {
  /**
  utils：通用方法
  */

  window.IUI_UTILS = {
    animateEnd: 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
    transitionEnd: 'webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd',
    toggleClass: function(className, target) {

      var el = target instanceof $ ? target : $(target);
      var toggleClass = el.hasClass(className) ? 'removeClass' : 'addClass';
      el[toggleClass](className);
    },
    isPlaceholder: function() {
      var input = document.createElement('input');
      return 'placeholder' in input;
    },
    throttle: function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      // 上次执行时间点
      var previous = 0;
      if (!options) options = {};
      // 延迟执行函数
      var later = function() {
        // 若设定了开始边界不执行选项，上次执行时间始终为0
        previous = options.leading === false ? 0 : new Date().getTime();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = new Date().getTime();
        // 首次执行时，如果设定了开始边界不执行选项，将上次执行时间设定为当前时间。
        if (!previous && options.leading === false) previous = now;
        // 延迟执行时间间隔
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        // 延迟时间间隔remaining小于等于0，表示上次执行至此所间隔时间已经超过一个时间窗口
        // remaining大于时间窗口wait，表示客户端系统时间被调整过
        if (remaining <= 0 || remaining > wait) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
          //如果延迟执行不存在，且没有设定结尾边界不执行选项
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },
    debounce: function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;

      var later = function() {
        var last = new Date().getTime() - timestamp;
        if (last < wait && last > 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = new Date().getTime();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }

        return result;
      };
    }
  };

  window.IUI = {};


  $.fn.IUI = function() {
    var arg = arguments;
    var method = arguments[0];
    if (IUI[method]) {
      method = IUI[method];
      arg = Array.prototype.slice.call(arg, 1);
      return method.apply(this, arg);
    } else if (typeof(method) == 'object' || !method) {
      for (var name in method) {
        IUI = $.extend(IUI, method);
        method = IUI[name];
        break;
      }
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.IUI Plugin');
      return this;
    }
  };

  /**
   * pub_sub
   * 发布/订阅模式
   */
  var o = $({});

  $.extend({
    sub: function() {

      o.on.apply(o, arguments);
    },
    unsub: function() {
      o.off.apply(o, arguments);
    },
    pub: function() {
      o.trigger.apply(o, arguments);
    }
  });

  /**
   * alert 组件
   * @param {String}      title 标题                   默认为空
   * @param {String}      content 内容                 默认为空
   * @param {String}      confirmText                 确定按钮文本
   * @param {String}      cancelText                  取消按钮文本
   * @param {Boolean}     closeBtn                    是否开启关闭按钮
   * @param {Boolean}     shadow                      是否开启点击阴影关闭
   * @param {String}      type                        可选择 alert 或 confirm，区别在于有无【取消按钮】
   * @param {String}      status                      状态类，如 success , error , warning , info
   * @param {Function}    before                      回调函数 - 弹出前
   * @param {Function}    confirm                     回调函数 - 点击确认按钮后触发
   * @param {Function}    cancel                      回调函数 - 点击取消按钮后触发
   *
   *
   * @param $.alert({options});
   */
  $.extend({
    alert: function(options) {

      var $body = $('body');
      var animateTime = document.all && !window.atob ? 0 : 200;
      var defaults = {
        title: '',
        content: '',
        confirmText: '确定',
        cancelText: '取消',
        closeBtn: false,
        shadow: true,
        type: 'confirm',
        status: 'default',
        keyboard: true,
        before: function() {},
        confirm: function() {},
        cancel: function() {}
      };

      var config = $.extend({}, defaults, options);

      var container = create();
      /**
       * [deferred description]
       * @type {Object}
       * @description 在回调函数中使用
       */
      var deferred = {
        showAlert: function() {
          show(container);
        },
        hideAlert: function() {
          hide(container);
        },
        target: container
      };

      if (!$.alertBackdrop) {
        $.alertBackdrop = $('<div class="IUI-alert-backdrop" style="display:none"></div>');
        $body.append($.alertBackdrop);
      }


      if (config.shadow) {
        $body.on('touchstart.iui-alert click.iui-alert', '.IUI-alert-container', function(event) {
          event.preventDefault();
          hide(container);
        });
      }

      $body.on('touchstart.iui-alert click.iui-alert', '.IUI-alert-main', function(event) {
        event.stopPropagation();
      });

      container.on('touchstart.iui-alert click.iui-alert', '.IUI-alert-confirm', function(event) {

        if (config.type === 'alert') {

          if (config.cancel.call(this, deferred) === false) {
            return false;
          }

          hide(container);

          return false;
        }

        if (config.confirm.call(this, deferred) === false) {
          return false;
        }

      });

      container.on('touchstart.iui-alert click.iui-alert', '.IUI-alert-cancel,.IUI-alert-close', function(event) {
        if (config.cancel.call(this, deferred) === false) {
          return false;
        }

        hide(container);
      });


      if (config.keyboard) {
        if (config.keyboard) {
          $(window).on('keyup.iui-alert', function(event) {
            // keyCode => esc
            if (event.keyCode === 27) {
              container.find('.IUI-alert-cancel,.IUI-alert-close').trigger('click.iui-alert');
            }
            // keyCode => enter
            if (event.keyCode === 13) {
              container.find('.IUI-alert-confirm').trigger('click.iui-alert');
            }
          });
        }
      }

      /**
       * [show description]
       * @param  {jQuery object} target 需要显示的对象
       */
      function show(target) {
        target.removeClass('hide');
        target.find('.IUI-alert-main').addClass('alert-opening');
        $.alertBackdrop.removeClass('hide');
        $.alertBackdrop.fadeIn(animateTime, function() {
          target.find('.IUI-alert-main').removeClass('alert-opening');
        });
      }
      /**
       * [hide description]
       * @param  {jQuery object} target 需要隐藏的对象
       */
      function hide(target) {
        $([$body, target]).off('touchstart.iui-alert click.iui-alert');
        target.addClass('alert-closing');
        $.alertBackdrop.fadeOut(animateTime, function() {
          $(this).addClass('hide');
          target.remove();
        });
      }
      /**
       * [create description]
       * @return {string} 拼接html
       */
      function create() {
        var isConfirm = config.type === 'confirm';

        var _closeBtn = '<span class="IUI-alert-close"></span>';

        var _confirmBtn = '<a href="javascript:;" class="IUI-alert-confirm btn-primary btn-sm btn">' + config.confirmText + '</a>';

        var _cancelBtn = '<a href="javascript:;" class="IUI-alert-cancel btn-default btn-sm btn">' + config.cancelText + '</a>';

        var _header = '<div class="IUI-alert-header">' + (config.title || '') + (config.closeBtn ? _closeBtn : '') + '</div>';

        var _content = '<div class="IUI-alert-content">' + (config.content || '') + '</div>';

        var _footer = '<div class="IUI-alert-footer">' + _confirmBtn + (isConfirm ? _cancelBtn : '') + '</div>';

        var _main = _header + _content + _footer;

        var $container = $('<div class="IUI-alert-container hide"><div class="IUI-alert-main ' + config.status + '">' + _main + '</div></div>');

        $body[0].appendChild($container[0]);

        return $container;
      }

      if (config.before.call(this, deferred) === false) {
        return false;
      }

      show(container);

    }
  });

  /*!
   * jQuery Cookie Plugin v1.4.1
   * https://github.com/carhartl/jquery-cookie
   *
   * Copyright 2006, 2014 Klaus Hartl
   * Released under the MIT license
   *
   * @example : $.cookie('name', 'value', { expires: 7, path: '' });
   */

  $.extend({
    cookie: function(key, value, options) {

      /**
       * cookie set
       */
      if (arguments.length > 1 && String(value) !== "[object Object]") {

        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
          options.expires = -1;
        }

        if (typeof options.expires === 'number') {
          var days = options.expires,
            t = options.expires = new Date();
          t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
          encodeURIComponent(key), '=',
          options.raw ? value : encodeURIComponent(value),
          options.expires ? '; expires=' + options.expires.toUTCString() : '',
          options.path ? '; path=' + options.path : '',
          options.domain ? '; domain=' + options.domain : '',
          options.secure ? '; secure' : ''
        ].join(''));
      }

      /**
       * cookie get
       */
      options = value || {};

      var result, decode = options.raw ? function(s) {
        return s;
      } : decodeURIComponent;

      return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
    }
  });

  /**
   * loading 组件
   * @param {Boolean}         open        显示或隐藏 true/false
   * @param {Boolean}         mobile      选择 css3 æˆ– git
   * @param {jQuery Object}   context     loadingæ‰€åœ¨çš„ä¸Šä¸‹æ–‡ï¼Œ
   *
   * @example
   *
   * $.loading(true)
   *
   */
  $.extend({
    loading: function(open, mobile, context) {
      // å½“å‚æ•°é•¿åº¦å¤§äºŽ1ï¼Œåˆ™ä½¿ç”¨CSS3 loadingæ•ˆæžœ
      // contextæ˜¯æ‰§è¡ŒçŽ¯å¢ƒ
      var arg = arguments;
      var type = arg.length > 1;
      var display = arg[0];
      var $context = context || $('body');
      var loadingStr = '<div class="IUI-loading">' + (type ? '<div class="loader-inner ball-clip-rotate"><div></div></div>' : '<img src="http://img.yi114.com/201571121314_382.gif" width="32" height="32">') + '</div>';
      if (display) {
        $context.append('<div class="IUI-loading-backdrop"></div>' + loadingStr);
      } else {
        $context.find('.IUI-loading-backdrop,.IUI-loading').remove();
      }

    }
  });

  /**
   * tip ç»„ä»¶
   * @param {String,jQuery Object}        obj         è¢«æç¤ºçš„å¯¹è±¡ï¼Œå¯ä¼  id æˆ– jQuery å¯¹è±¡
   * @param {String}                      text        æ–‡æœ¬
   * @param {Number}                      timeout     å¤šå°‘æ¯«ç§’åŽéšè—æç¤º
   * @param {Boolean}                     status      çŠ¶æ€ï¼Œsuccess or error
   * @param {Boolean}                     position    è‡ªå®šä¹‰ä½ç½®ï¼Œå½“å®ƒä¸º true æ—¶ï¼Œ obj å°†æˆä¸ºtipçš„ä½ç½®å‚ç…§ç‰©
   * @param {Array}                       offset      è‡ªå®šä¹‰ä½ç½®å¾®è°ƒå€¼ï¼Œoffset[0] = x, offset[1] = y
   * @param {Function}                    callback    å›žè°ƒå‡½æ•° - hide æ—¶è§¦å‘
   *
   */
  $.extend({
    tip: function(options) {
      var param = $.extend({
        obj: "#global-tip",
        text: '',
        timeout: 3000,
        status: true,
        position: false,
        offset: [0, 5],
        callback: null
      }, options);

      var obj = param.obj instanceof $ ? param.obj : $(param.obj);
      var status = param.status ? 'success' : 'error';
      var count = obj.data('count') || 1;
      var id = new Date().getTime();
      var objWidth = obj.outerWidth();
      var objHeight = obj.outerHeight();
      var x = obj.offset().left;
      var y = obj.offset().top;
      var tip;

      clearTimeout(obj.data('count'));

      if (param.position) {
        if (typeof obj.attr('data-tip') === 'undefined') {

          $('<div class="tips" id="tip_' + id + '" style="left:' + (x + param.offset[0]) + 'px;top:' + (y + objHeight + param.offset[1]) + 'px"></div>').appendTo('body');
          obj.attr('data-tip', id);

        }
        tip = $('#tip_' + obj.attr('data-tip'));

      }

      var target = param.position === 'custom' ? tip : obj;

      target.html('<span class="' + status + '">' + param.text + '</span>').removeClass('hide');

      obj.data('count', setTimeout(function() {

        target.addClass('hide');

        if (param.callback) {
          param.callback();
        }

      }, param.timeout));

    }
  });

  /**
   * layer 组件
   * @param  {String}            container           组件的执行上下文环境，默认是body
   * @param  {Boolean}           cache               是否缓存 ajax 页面
   * @param  {Boolean}           shadow              是否开启阴影层关闭
   * @param  {String}            confirmHandle       确认按钮Class
   * @param  {String}            closeHandle         关闭按钮Class
   * @param  {String}            offsetWidth         layer 宽度
   * @param  {String}            offsetHeight        layer 高度
   * @param  {String}            animateClass        弹出动画Class
   * @param  {String}            url                 ajax url
   * @param  {String}            dataType            ajax dataType : html,json,xml ...
   * @param  {String}            method              ajax type : get/post
   * @param  {String}            data                ajax data
   * @param  {Function}          successCall         ajax success callback
   * @param  {Function}          errorCall           ajax error callback
   * @param  {Function}          showCall            回调函数 - 显示触发
   * @param  {Function}          confirmCall         回调函数 - 确认触发
   * @param  {Function}          cancelCall          回调函数 - 关闭触发
   *
   * @method [showLayer]  显示层
   * @method [hideLayer]  隐藏层
   * @method [ajaxLoad]   ajax 弹层
   * @method [cutTo]      切换层
   *
   * @event
   *
   * $('selector').on('layer.show',function(){});
   * $('selector').on('layer.hide',function(){});
   *
   * @example
   *
   * var layerId = $('#layerId').IUI('layer'); // 注意：layerId必须是唯一，当页面中没有div#layerId，将自动创建，并 append 到 container 中
   * layerId.showLayer();
   * layerId.hideLayer();
   * layerId.ajaxLoad();
   *
   * html基本结构
   * div.layer-box.hide#layerId>div.layer-content
   *
   *
   */

  (function($, window) {

    var scrollBarWidth = IUI_UTILS.scrollBarWidth;

    var $body = $('body');
    var backdrop = $('<div class="layer-backdrop" style="display:none"></div>');
    // 检测是否IE9-
    // 注：animateTime的时间与 layer-opening css 的 animation-time 必须一致
    var animateTime = document.all && !window.atob ? 0 : 200;

    function hideCall(obj) {
      var self = obj;
      //隐藏弹层
      self.$selector.addClass('hide');
      //移除css3隐藏动画
      self.$content.removeClass('layer-closing');
      //恢复 body 滚动条
      $body.removeAttr('style');
    }

    function Layer(config, selector) {
      var defaults = {
        container: 'body',
        cache: false,
        shadow: true,
        confirmHandle: '.btn-confirm',
        closeHandle: '.btn-cancel,.btn-close',
        offsetWidth: 'auto',
        offsetHeight: 'auto',
        url: $(this).attr('data-url') || false,
        dataType: $(this).attr('data-dataType') || 'html',
        data: '',
        method: 'GET',
        content: '',
        showCall: function() {},
        hideCall: function() {},
        successCall: function() {},
        errorCall: function() {},
        confirmCall: function() {},
        cancelCall: function() {}
      };
      this.$selector = selector;
      this.config = $.extend(defaults, config);
      //创建遮罩层
      this.$backdrop = backdrop;

      this.init();
      this.event();
    }

    Layer.prototype.init = function() {
      var self = this;
      var config = self.config;
      var template = '<div class="layer-box hide" id="{{layerName}}"><div class="layer-content">' + config.content + '</div></div>';
      var $selector = this.$selector = self.$selector.length ? self.$selector : $(template.replace('{{layerName}}', self.$selector.selector.replace('#', ''))).appendTo(config.container);
      var $container = config.container === 'body' ? $body : $(config.container);
      var closeHandle = config.closeHandle;
      var $content = this.$content = $selector.find('.layer-content');
      var layerWidth = Number($selector.attr('data-width')) || config.offsetWidth;
      var layerHeight = Number($selector.attr('data-height')) || config.offsetHeight;

      $content.css({
        width: layerWidth,
        height: layerHeight
      });

      $selector.data('layer', self);

    };

    Layer.prototype.ajaxLoad = function() {
      var self = this;
      var config = self.config;
      var $selector = self.$selector;
      var requestUrl = config.url || '?';
      var method = ($selector.attr('data-method') || config.method).toUpperCase();
      var dataType = config.dataType;

      if (config.cache && $selector.data('success')) {
        self.showLayer();
        return false;
      }

      $.loading(true, true);
      $selector.data('success', 1);

      $.ajax({
        url: requestUrl,
        type: method,
        dataType: dataType,
        data: config.data
      }).then(function(res) {
        $.loading(false);
        config.successCall.apply($selector, [res, this, self]);
        self.showLayer();
      }, function(err) {
        $.loading(false);
        self.hideLayer();
        config.errorCall.apply($selector, [err, this, self]);
      });

      return self;
    };

    Layer.prototype.event = function() {
      var self = this;
      var config = self.config;
      var $selector = self.$selector;

      //确认事件
      $selector.on('click.iui-layer', config.confirmHandle, function(event) {
        event.preventDefault();
        config.confirmCall.apply($selector, [event, this]);
        return false;
      });

      // 阴影层事件
      $selector.on('click.iui-layer', function(event) {
        if ($(event.target).is($selector)) {

          if (!config.shadow) {
            return false;
          }
          if ($body.find('.layer-loading').length) {
            return false;
          }
          self.hideLayer();
          config.cancelCall.apply($selector, [event, this]);
        }
      });


      //绑定关闭事件
      $selector.on('click.iui-layer', config.closeHandle, function(event) {
        self.hideLayer();
        config.cancelCall.apply($selector, [event, this]);
        return false;
      });
    };

    Layer.prototype.showLayer = function(cutto) {
      var self = this;
      var config = self.config;
      var $backdrop = self.$backdrop;
      var screenH = document.documentElement.clientHeight;
      var GtIE10 = document.body.style.msTouchAction === undefined;
      var isCutto = cutto;
      // 当body高度大于可视高度，修正滚动条跳动
      // >=ie10的滚动条不需要做此修正,tmd :(
      if ($('body').height() > screenH & GtIE10) {
        $body.css({ 'border-right': scrollBarWidth + 'px transparent solid', 'overflow': 'hidden' });
      }
      //显示层
      self.$selector.removeClass('hide');
      if (isCutto) {
        setTimeout(animateTime, function() {
          //注：animateTime的时间与 layer-opening css 的 animation-time 必须一致
          //移除-弹层-css3显示动画
          self.$content.removeClass('layer-opening');
        });
      } else {
        //插入-遮罩-dom
        self.$selector.after($backdrop);
        //插入-遮罩-显示动画
        $backdrop.fadeIn(animateTime, function() {
          //注：animateTime的时间与 layer-opening css 的 animation-time 必须一致
          //移除-弹层-css3显示动画
          self.$content.removeClass('layer-opening');
        });
      }

      //插入-弹层-css3显示动画
      self.$content.addClass('layer-opening');
      // 绑定 esc 键盘控制
      $(document).on('keyup.iui-layer', function(event) {
        if (event.keyCode === 27) {
          self.$selector.trigger('click.iui-layer', config.closeHandle);
        }
      });
      //触发show事件
      self.$selector.trigger('layer.show', [self]);
      //触发showCall回调
      config.showCall.apply(self.$selector, [self]);
      //返回Layer对象
      return self;
    };


    Layer.prototype.hideLayer = function(cutto) {
      var self = this;
      var config = self.config;
      var isCutto = cutto;

      //插入-弹层-隐藏动画
      self.$content.addClass('layer-closing');

      if (isCutto) {
        hideCall(self);
      } else {
        //插入-遮罩-隐藏动画
        self.$backdrop.fadeOut(animateTime, function() {
          hideCall(self);
          //移除遮罩dom
          $(this).remove();
        });
      }
      // 绑定 esc 键盘控制
      $(document).off('keyup.iui-layer');
      //触发hide事件
      self.$selector.trigger('layer.hide', [this]);
      //触发hideCall回调
      config.hideCall.apply(self.$selector, [self]);

      return self;
    };

    Layer.prototype.cutTo = function(nextId, currentId) {
      var nextLayer = $(nextId).data('layer');
      var currentLayer = (currentId ? $(currentId) : this.$selector).data('layer');

      currentLayer.hideLayer(true);
      nextLayer.showLayer(true);

    };

    Layer.prototype.destroy = function() {
      var self = this;
      var $selector = self.$selector;
      var config = self.config;
      //确认事件
      $selector.off('click.iui-layer', config.confirmHandle);
      $selector.off('click.iui-layer');
      $selector.off('click.iui-layer', config.closeHandle);
      $selector.remove();
    };


    $.fn.IUI({
      layer: function(config) {
        return new Layer(config, this);
      }
    });

  }(jQuery, window));
  
  /**
     * placeholder 组件
     * @param {color}     color           placeholder color
     * @param {String}    zIndex          placeholder z-index 需高于input
     * @param {Number}    top             placeholder 相对input父元素定位top值
     * @param {Number}    left            placeholder 相对input父元素定位top值
     *
     * @example
     * $('body').IUI('placeholder',{color:'#999',zIndex:1});
     */

    $.fn.IUI({
        placeholder: function(options) {
            if ('placeholder' in document.createElement('input')) {
                return;
            }

            var defaults = {
                    color: '#999', //placeholder color
                    zIndex: 1, //针对position:absolute的input元素，label覆盖在input之上
                    top: 0, //placeholder相对父元素绝对定位
                    left: 0 //placeholder相对父元素绝对定位
                },
                param = $.extend({}, defaults, options || {}),
                $eles = $(this).find('input[type="text"],input[type="password"],input[type="tel"],input[type="email"],textarea');

            return $eles.each(function(i, n) {
                var $ele = $(n),
                    ele = n, //ele供原生事件onpropertychange调用
                    placeholder = $ele.attr('placeholder');

                var $elel = $('<label></label>').css({
                    position: 'absolute',
                    top: param.top,
                    left: param.left,
                    color: param.color,
                    zIndex: param.zIndex,
                    height: 0,
                    lineHeight: $ele.css('height'),
                    fontSize: $ele.css('fontSize'),
                    paddingLeft: $ele.css('textIndent') ? $ele.css('textIndent') : $ele.css('paddingLeft'),
                    background: 'none',
                    cursor: 'text'

                }).text(placeholder).insertBefore($ele);

                $ele.parent().css({
                    'position': 'relative'
                });

                if ($ele.val()) {
                    $elel.hide();
                }

                //事件绑定
                $elel.on({
                    click: function() {
                        $elel.hide();
                        $ele.focus();
                    }
                });
                $ele.on({
                    focus: function() {
                        $elel.hide();
                    },
                    blur: function() {
                        if (!$ele.val()) {
                            $elel.show();
                        }
                    },
                    input: function() {
                        if ($ele.val()) {
                            $elel.hide();
                        } else {
                            $elel.show();
                        }
                    }
                });
                //IE6-8不支持input事件，另行绑定
                ele.onpropertychange = function(event) {
                    event = event || window.event;
                    if (event.propertyName === 'value') {
                        var $this = $(this);
                        if ($this.val()) {
                            $(this).prev('label').hide();
                        } else {
                            $(this).prev('label').show();
                        }
                    }
                };
            });
        }
    });
  
  /**
   * returnTop 组件
   * @param {String}          target              需绑定点击事件的对象
   * @param {Number}          showTop             滚动 showTop 后出现
   * @param {Number}          bottom              è·ç¦»çª—å£åº•éƒ¨ bottom px
   * @param {Number}          delay               åŠ¨ç”»æ—¶é•¿
   */
  $.fn.IUI({
    returnTop: function(options) {
      var defaults = {
        target: '.returnTop-btn',
        showTop: 100,
        bottom: 50,
        delay: 300
      };
      var $selector = $(this);
      var $window = $(window);
      var config = $.extend({}, defaults, options);
      var $target = $selector.find(config.target);
      var scrollPosition = function(obj, target) {

        if (target > config.showTop && obj.hasClass('hide')) {
          obj.removeClass('hide');
        }

        if (target < config.showTop && !obj.hasClass('hide')) {
          obj.addClass('hide');
        }

        return false;

      };

      scrollPosition($target, $window.scrollTop());

      $selector.css({
        'bottom': config.bottom
      });

      $window.on('scroll', function(event) {
        scrollPosition($target, $(window).scrollTop());
      });

      $selector.on('click', config.target, function(event) {
        $("body,html").stop().animate({
          scrollTop: 0
        }, config.delay);
        return false;
      });

    }
  });

  /**
   * tabs ç»„ä»¶
   *
   * @Options
   *
   * @param {[String]}         [event]                        äº‹ä»¶åç§°
   * @param {[String]}         [animateBefore]                å‰åŠ¨ç”»ï¼Œå› transitionåŠ¨ç”»éœ€è¦ä¸¤ä¸ªclassæ”¯æŒï¼Œå› æ­¤åŒºåˆ†beforeå’Œafter
   * @param {[String]}         [animateAfter]                 åŽåŠ¨ç”»ï¼Œå…·ä½“å‚è€ƒbootstrap tabçš„åŠ¨ç”»æ•ˆæžœ fade & in
   * @param {[Boolean]}        [isCache]                      æ˜¯å¦ç¼“å­˜ï¼Œajaxè¯·æ±‚å†…å®¹æ—¶ä½¿ç”¨ï¼Œé»˜è®¤ç¼“å­˜
   * @param {[Object]}         [ajaxSetup]                    ajax è¯·æ±‚é…ç½®
   *
   *
   * @Events
   *
   * $('selctor').on('tabsAjaxBefore',function(){});
   * $('selctor').on('tabsAjaxSuccess',function(){});
   *
   *
   * @Usage
   *
   * $('selector').IUI('tabs',{
   *    event:'mouseenter',
   *    animateBefore:'fade',
   *    animateAfter:'in'
   * });
   *
   */

  ;
  (function($) {
    /**
     * [show description]
     * @param  {[jQuery Object]}            target              ç›®æ ‡å…ƒç´ 
     * @param  {[Object]}                   config              é…ç½®
     */
    function show(target, config) {
      var $target = target;
      $target.addClass('active ' + config.animateBefore);
      setTimeout(function() {
        $target.addClass(config.animateAfter);
      }, 100);
    }
    $.fn.IUI({
      tabs: function(options) {
        return this.each(function() {
          var defaults = {
            event: 'click',
            animateBefore: 'fade',
            animateAfter: 'in',
            isCache: true,
            ajaxSetup: null
          };

          var $selector = $(this);
          //避免与tabs嵌套tabs时冲突
          var $items = $selector.find('.tabs-item');
          var config = $.extend({}, defaults, options);

          $selector.on(config.event + '.iui-tabs', '.tabs-item', function(event) {
            event.preventDefault();
            var $this = $(this);
            var $parent = $this.parent();
            var $target = $($this.attr('href'));
            $target.trigger('tabsAjaxBefore', [config]);
            // switch tabs-item class
            $parent.addClass('active').siblings('.active').removeClass('active');
            // switch tabs-content class
            $target.siblings('.tabs-content').removeClass('active ' + config.animateBefore + ' ' + config.animateAfter);

            show($target, config);

            if ($this.data('loaded') && config.isCache) {
              return false;
            }

            if ($this.data('ajax')) {
              $.ajax($.extend({
                url: $this.data('ajax'),
                type: 'GET',
                dataType: 'html'
              }, config.ajaxSetup)).then(function(res) {
                $this.data('loaded', true);
                $target.trigger('tabsAjaxSuccess', [res]);
              }, function(err) {
                console.log(err);
              });
            }

            show($target, config);

          });

        });
      }
    });
  }(jQuery));

  /**
   * ajaxForm 组件
   * @param {String}      url
   * @param {String}      method
   * @param {String}      type
   * @param {Function}    before
   * @param {Function}    success
   * @param {Function}    error
   * @param {Function}    pending
   * @param {Function}    always
   */
  $.fn.IUI({
    ajaxForm: function(options) {
      return this.each(function() {
        var $selector = $(this);
        var defaults = {
          url: $selector.attr('action'),
          method: $selector.attr('method') || 'POST',
          type: $selector.attr('data-type') || 'json',
          data: $selector.attr('data-ajaxType') || 'ajax',
          param: false,
          before: function() {},
          success: function() {},
          error: function() {},
          pending: function() {},
          always: function() {}

        };

        var $fields = $selector.find('input');
        var config = $.extend({}, defaults, options);

        $selector.data('deferred', config);

        $selector.on('submit', function(event) {
          event.preventDefault();
          var args = Array.prototype.slice.call(arguments);
          if ($selector.hasClass('disabled')) {

            config.pending.call($selector, config);

            return false;
          }

          var beforeResult = config.before.call($selector, args, config);

          var args = {
            url: config.url,
            type: config.method,
            data: config.param || $selector.serialize()
          };

          // ajax2
          if (config.data !== 'ajax') {
            args.data = new FormData($selector[0]);
            args.cache = false;
            args.contentType = false;
            args.processData = false;
          }

          if (beforeResult === false) {
            return false;
          }
          $selector.addClass('disabled').prop('disabled', true);
          $.ajax(args).then(function(res) {
            $selector.removeClass('disabled').prop('disabled', false);
            config.success.call($selector, res, config, args);
          }, function(err) {
            $selector.removeClass('disabled').prop('disabled', false);
            config.error.call($selector, err, config, args);
          }).always(function(res) {
            config.always.call($selector, res, config, args);
          });
        });

      });
    }
  });

  /**
   * validate ç»„ä»¶
   *
   * *** options ***
   *
   * @param {Boolean}                      ajaxValidate        å¯åŠ¨ajaxéªŒè¯
   * @param {Element selector}             globalMessage       å…¨å±€æç¤ºidï¼Œè‹¥ä¸ºfalseï¼Œåˆ™é€é¡¹æç¤º
   * @param {Element selector}             errorClass          éªŒè¯ä¿¡æ¯ - é”™è¯¯ class
   * @param {Element selector}             infoClass           éªŒè¯ä¿¡æ¯ - æç¤º class  è‹¥ä¸ºfalseï¼Œåˆ™æ— infoæç¤º
   * @param {Element selector}             successClass        éªŒè¯ä¿¡æ¯ - æˆåŠŸ class  è‹¥ä¸ºfalseï¼Œåˆ™æ— infoæç¤º
   * @param {Boolean}                      unblur              å–æ¶ˆbluräº‹ä»¶
   * @param {Array}                        collections         éªŒè¯è§„åˆ™é…ç½®
   * @param {Object}                       strategy            æ–°å¢žéªŒè¯è§„åˆ™
   *
   *
   * collections è¯­æ³•ï¼š[{éªŒè¯é¡¹},{éªŒè¯é¡¹},{éªŒè¯é¡¹},{éªŒè¯é¡¹}]
   *
   * éªŒè¯é¡¹ è¯­æ³•ï¼š
   *
      {
          required: 'password',                                 // å¯¹åº” input[data-required]
          context: '.form-group',                               // data-requiredçš„æ‰§è¡Œä¸Šä¸‹æ–‡
          infoMsg: 'è¯·è¾“å…¥æ‚¨çš„å¯†ç ï¼Œå­—ç¬¦é•¿åº¦ä¸º3-16ä½',             // æç¤ºä¿¡æ¯
          matches: {                                           // ç»„åˆéªŒè¯
              isNonEmpty: {                                    // å¯¹åº” strategy ä¸­å­˜åœ¨çš„éªŒè¯æ–¹æ³•
                  errMsg: 'å¯†ç ä¸èƒ½ä¸ºç©º'                        //  éªŒè¯é”™è¯¯çš„è¿”å›žä¿¡æ¯
              },
              between: {
                  errMsg: 'å¯†ç é•¿åº¦ä¸º6-16ä½',
                  range:[6,16]                                //å¯è‡ªå®šä¹‰å­—æ®µ
              }
          }
      }

   *
   *
   * *** events ***
   *
   * $('any element').on('validate.focus',function(event,matches){});
   *
   * $('any element').on('validate.blur',function(event,matches){});
   *
   *
   *
   * *** methods ***
   *
   *  batch           详情请查阅源码部分
   *  message         详情请查阅源码部分
   *  verify          详情请查阅源码部分
   *
   */
  /**
   * validate 组件
   *
   * *** options ***
   *
   * @param {Element selector}             globalMessage       全局提示id，若为false，则逐项提示
   * @param {Element selector}             errorClass          验证信息 - 错误 class
   * @param {Element selector}             infoClass           验证信息 - 提示 class  若为false，则无info提示
   * @param {Element selector}             successClass        验证信息 - 成功 class  若为false，则无info提示
   * @param {Array}                        collections         验证规则配置
   * @param {Object}                       strategy            新增验证规则
   *
   *
   * collections 语法：[{验证项},{验证项},{验证项},{验证项}]
   *
   * 验证项 语法：
   *
      {
          required: 'password',                                 // 对应 input[data-required]
          context: '.form-group',                               // data-required的执行上下文
          infoMsg: '请输入您的密码，字符长度为3-16位',             // 提示信息
          matches: {                                           // 组合验证
              isNonEmpty: {                                    // 对应 strategy 中存在的验证方法
                  errMsg: '密码不能为空'                        //  验证错误的返回信息
              },
              between: {
                  errMsg: '密码长度为6-16位',
                  range:[6,16]                                //可自定义字段
              }
          }
      }

   *
   *
   * *** events ***
   *
   * $('any element').on('validate.focus',function(event,matches){});
   *
   * $('any element').on('validate.blur',function(event,matches){});
   *
   *
   *
   * *** methods ***
   *
   *  batch           详情请查阅源码部分
   *  message         详情请查阅源码部分
   *  verify          详情请查阅源码部分
   *
   */
  $.fn.IUI({
    validate: function(options) {
      /**
       *
       * GLOB_STRATEGY    默认验证策略集合
       *
       */
      var GLOB_STRATEGY = {
        isNonEmpty: function(params) {
          var $target = this.self;
          var value = $target[0].value;
          if ($.trim(value).length === 0) {
            return false;
          }
        },
        minLength: function(params) {
          //大于
          if (this.self[0].value.length < params.minLength) {
            return false;
          }
        },
        maxLength: function(params) {
          //å°äºŽ
          if (this.self[0].value.length < params.maxLength) {
            return false;
          }
        },
        birthdayRange: function(params) {
          //ç”Ÿæ—¥èŒƒå›´
          var val = this.self[0].value;
          var min = params.range[0];
          var max = params.range[1];
          if (val < min || val > max) {
            return false;
          }
        },
        isBirthday: function(params) {
          //æ˜¯å¦ä¸ºç”Ÿæ—¥
          if (!/^[1-9]\d{3}([-|\/|\.])?((0\d)|([1-9])|(1[0-2]))\1(([0|1|2]\d)|([1-9])|3[0-1])$/.test(this.self[0].value)) {
            return false;
          }
        },
        isMobile: function(params) {
          //æ˜¯å¦ä¸ºæ‰‹æœºå·ç 
          if (!/^1[3|4|5|6|7|8][0-9]\d{8}$/.test(this.self[0].value)) {
            return false;
          }
        },
        isEmail: function(params) {
          //æ˜¯å¦ä¸ºé‚®ç®±
          if (!/(^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$)/.test(this.self[0].value)) {
            return false;
          }
        },
        between: function(params) {
          var $target = this.self;
          var length = this.self[0].value.length;
          var min = params.range[0];
          var max = params.range[1];
          if (length < min || length > max) {
            return false;
          }

        },
        //çº¯è‹±æ–‡
        onlyEn: function(params) {
          if (!/^[A-Za-z]+$/.test(this.self[0].value)) {
            return false;
          }
        },
        //éžä¸­æ–‡
        notZh: function(params) {
          if (!/^[A-Za-z0-9._\-]*$/.test(this.self[0].value)) {
            return false;
          }
        },
        //çº¯ä¸­æ–‡
        onlyZh: function(params) {
          if (!/^[\u4e00-\u9fa5]+$/.test(this.self[0].value)) {
            return false;
          }
        },
        //éžæ•´æ•°
        notInt: function(params) {
          if (/^[0-9]*$/.test(this.self[0].value)) {
            return false;
          }
        },
        //æ•°å­—åŒ…å«å°æ•°
        onlyNum: function(params) {
          if (!/^[0-9]+([.][0-9]+){0,1}$/.test(value)) {
            return false;
          }
        },
        //æ•´æ•°
        onlyInt: function(params) {
          if (!/^[0-9]*$/.test(this.self[0].value)) {
            return false;
          }
        },
        //éž0
        notZero: function(params) {
          if (this.self[0].value=='0') {
            return false;
          }
        },
        //è‡³å°‘é€‰ä¸­ä¸€é¡¹ radio || checkbox
        isChecked: function(params) {
          var result = void(0);
          this.self.each(function(index, el) {
            result = el.checked;
            return result ? false : true;
          });
          return result ? void(0) : false;
        },
        isUrl: function(params) {
          var urlR = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
          if (!urlR.test(this.self[0].value)) {
            return false;
          }
        },
        //昵称
        isNickname: function(params) {
          if (!/^[A-Za-z0-9_\-\u4e00-\u9fa5]{2,20}$/i.test(this.self[0].value)) {
            return false;
          }
        },
        isUserName: function(params) {
            var reg = /^[\u4E00-\u9FA5]{2,4}$/;
            if (!reg.test(this.self[0].value)) {
                return false; 
            } 
        },
        wordLength: function(params) {
          var entryVal = this.self[0].value;
          var entryLen = entryVal.length;
          var cnChar = entryVal.match(/[^\x00-\x80]/g);
          if (cnChar) {
            entryLen += cnChar.length;
          }
          if (entryLen > 8) {
            return false;
          }
        }

      };
      var defaults = {
        globalMessage: false,
        errorClass: '.validate-error',
        infoClass: '.validate-info',
        successClass: '.validate-success',
        collections: [],
        strategy: GLOB_STRATEGY
      };

      var selector = this;

      function Validate(options) {
        this.container = 'body';
        this.options = $.extend(true, {}, defaults, options);
        this.$selector = selector;
        this.cache = {};
        this.init();
      }


      /**
       * init方法     初始化
       */
      Validate.prototype.init = function() {
        var self = this;
        var statusArr = ['info', 'success', 'error'];
        if(self.options.collections.length === 0){
          return false;
        }
        self.add();
        $.each(self.cache, function(name, fields) {
          if (fields.context.length === 0) {
            return;
          }
          var contextClassName = /validate-context-(info|success|error)/.exec(fields.context[0].className);
          var initStatus;
          if (contextClassName) {
            initStatus = contextClassName[1];
            fields.self.data('validateStatus', $.inArray(initStatus, statusArr));
          }
        });
      };


      /**
       * mapping方法      参数修正，将传入进来的数据转化另一种格式，并插入到cache中
       * @param {Object} options      每一项需要验证的配置参数
       *
       */
      Validate.prototype.mapping = function(options) {
        var $dom = this.$selector.find('[data-required=' + options.required + ']');
        var $context = $dom.parents(options.context).eq(0);

        //防止重复
        if (this.cache[options.required]) {
          return false;
        }

        $.extend(true, this.cache, (function() {
          var item = {};
          var target = item[options.required] = {};
          target.matches = {};
          target.self = $dom;
          target.context = $context;
          target.infoMsg = options.infoMsg || '';
          target.options = options;
          $.extend(true, target.matches, options.matches);
          return item;
        }()));
      };


      /**
       * remove方法                  传入 data-required 的值，删除对应的验证
       * @param {String}  target     data-required值
       *
       */
      Validate.prototype.remove = function(target) {
        var self = this;
        var options = self.options;
        var cache = self.cache;
        var queue, i = 0,
          len, name, src, required, type, $target;

        if (typeof target !== 'string') {
          return false;
        }

        queue = target.split(' ');

        len = queue.length;
        for (name in cache) {
          src = cache[name].self;
          required = src.data('required');
          type = src[0].type;
          $target = self.$selector.find('[data-required=' + required + ']');

          if ($.inArray(required, queue) !== -1) {
            if ($.inArray(type, ['checkbox', 'file', 'radio']) !== -1) {
              $target.off('change.iui-validate');
            } else {
              $target.off('focus.iui-validate blur.iui-validate');
            }
            $target.data('event.iui-validate', false);
            delete cache[name];
          }
        }
      };


      Validate.prototype.add = function(options) {
        var self = this;
        var collections = options || self.options.collections;
        for (var i = 0; i < collections.length; i++) {
          var target = self.$selector.find('[data-required="' + collections[i].required + '"]');
          var msg = "iui-validate:cannot find element by data-required=\"" + collections[i].required + "\"";

          if (target.length) {
            self.mapping(collections[i]);
          } else {
            if (window.console) {
              console.warn(msg);
            } else {
              throw msg;
            }
          }
        }

        if (options) {
          $.merge(self.options.collections, options);
        }

        self.bindEvent();
      };


      /**
       * bindEvent     行为方法，如：focus、blur、change
       */
      Validate.prototype.bindEvent = function() {
        var self = this;
        var handleArr = handler.call(this);
        var $selector = self.$selector;
        var changeHandleArr = ['select-one', 'select-multiple', 'radio', 'checkbox', 'file'];

        $.each(handleArr, function(key, value) {
          var $target = $selector.find(value);
          var type = $target.length ? $target[0].type : '';
          var requiredName = value.replace('[', '').replace(']', '').split('=')[1];
          if ($target.length === 0) {
            return;
          }

          if ($target.data('event.iui-validate')) {
            return;
          }

          if ($.inArray(type, changeHandleArr) !== -1) {
            $target.on('change.iui-validate', { self: self }, changeEmitter);
            $target.data('event.iui-validate', true);
            return;
          }

          $target.on('focus.iui-validate', { self: self }, focusEmitter);

          if (self.cache[requiredName].options.unblur !== true) {
            $target.on('blur.iui-validate', { self: self }, blurEmitter);
          }

          $target.data('event.iui-validate', true);

        });

      };

      /**
       * verify  行为触发验证
       * @param  {Object} glob      全局对象 Validate
       * @param  {String} eventName 事件名
       */
      Validate.prototype.verify = function(glob, eventName) {
        var $this = $(this);
        var collections = glob.cache[$this.data('required')];
        var matches = collections.matches;
        var status = false;
        /**
         * @param {String}      name        验证函数名
         * @param {Object}      params      验证字段（自定义字段）：errMsg、range
         */
        $.each(matches, function(name, params) {
          var result = glob.options.strategy[name].call(collections, params);
          status = result === void(0) ? 1 : 2;
          $this.data('validateStatus', result);
          glob.message(status, collections, name);

          return status === 2 ? false : true;

        });

        $this.trigger('validate.' + eventName, collections);

        return status;
      };

      /**
       * [message description]
       * @param  {Number} status      验证状态：0 未验证状态，1 验证且通过，2 验证且不通过
       * @param  {Object} options     被转化后的验证参数
       * @param  {String} matchesName 验证函数名
       *
       */
      Validate.prototype.message = function(status, options, matchesName) {

        var className, contextClass, msg, $target, $msgEl;

        contextClass = ['info', 'success', 'error'];

        $msgEl = this.options.globalMessage ? $(this.options.globalMessage) : options.context;


        if (status === 0) {
          className = this.options.infoClass;
          msg = options.infoMsg;
        } else if (status === 1) {
          className = this.options.successClass;
          msg = '';
        } else if (status === 2) {
          className = this.options.errorClass;
          msg = options.matches[matchesName].errMsg;
        } else {
          // 后期再考虑 status === anything ...
        }

        className = className.replace(/\./g, ' ').slice(1);
        $msgEl.removeClass('validate-context-info validate-context-success validate-context-error')
          .addClass('validate-context-' + contextClass[status]).find('.validate-message').remove();
        $target = $('<div class="validate-message ' + className + '" >' + msg + '</div>');
        $msgEl.append($target);

      };

      /**
       * batch    批量验证
       * @param  {Boolean}            circulation       强制循环，true：将全部验证，false：其中一个验证不通过将返回false并中断循环
       * @return {Boolean}
       *
       */
      Validate.prototype.batch = function(circulation) {
        var self = this;
        var status = [];
        $.each(this.cache, function(name, target) {
          if (target.self[0].disabled) {
            return;
          }
          var initStatus = target.self.data('validateStatus');
          var result = !initStatus ? self.verify.call(target.self, self, 'batch') : initStatus;

          if (circulation && result === 2) {
            status.push(result);
            return false;
          }

          status.push(result);
        });
        return $.inArray(2, status) === -1 ? true : false;
      };
      /**
       * handler 生成事件代理对象
       * @return {String}     事件委托目标
       */
      function handler() {
        var queue = [];
        var collections = this.cache;
        for (name in collections) {
          queue.push('[data-required=' + name + ']');
        }
        return queue;
      }

      function focusEmitter(event) {
        var self = event.data.self;
        var $this = $(this);
        var _name = $this.data('required');
        var collections = self.cache[_name];
        if (self.options.infoClass) {
          self.message(0, collections);
        }
        $this.trigger('validate.focus', collections);
      }

      function blurEmitter(event) {
        var $this = $(this);
        var self = event.data.self;
        var requiredName = $this.data('required');
        self.verify.call(this, self, 'blur');
      }

      function changeEmitter(event) {
        var self = event.data.self;
        self.verify.call(this, self, 'change');
      }

      return new Validate(options);
    }
  });

  /**
   * tooltip 组件
   * @param {String}  target          需要绑定的元素，支持css选择器语法
   * @param {String}  animateClass    动画类
   * @param {String}  event           事件，支持符合逻辑的鼠标类事件，如 click,dblclick,hover
   * @param {String}  template        html模板
   *
   *
   * @example
   * $(context).IUI('tooltip',{options...});
   */
  $.fn.IUI({
    tooltip: function(options) {

      var defaults = {
        target: '[data-tooltip]',
        animateClass: 'fadeIn',
        event: 'hover',
        template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-body"></div></div>'
      };

      var config = $.extend(defaults, options);
      var showHandle = config.event === 'hover' ? 'mouseenter' : 'click';
      var hideHandle = config.event === 'hover' ? 'mouseleave' : 'click';

      return this.each(function(index, ele) {
        var target = config.target;
        var animateClass = config.animateClass;
        $(ele).on(showHandle, target, function() {
          $('.tooltip').remove();
          var $ele = $(this);
          var _ele = this;
          var _elePosi = _ele.getBoundingClientRect();
          var _eleLeft = _elePosi.left;
          var _eleTop = _elePosi.top;
          var _eleWidth = _ele.offsetWidth;
          var _eleHeight = _ele.offsetHeight;

          var _tipDirec = $ele.attr('data-direction') || 'top',
            distance = $ele.attr('data-distance') * 1 || 5,
            title = $ele.attr('data-title');
          var $tip = $ele.after($(config.template)).next('.tooltip').addClass(_tipDirec + ' ' + animateClass);
          $tip.find('.tooltip-body').text(title);
          var _tipWidth = $tip[0].offsetWidth;
          var _tipHeight = $tip[0].offsetHeight;


          var left, top;

          if (_tipDirec == 'top') {
            left = _eleLeft + (_eleWidth - _tipWidth) / 2;
            top = _eleTop - _tipHeight - distance;
          } else if (_tipDirec == 'right') {
            left = _eleLeft + _eleWidth + distance;
            top = _eleTop + (_eleHeight - _tipHeight) / 2;
          } else if (_tipDirec == 'bottom') {
            left = _eleLeft + (_eleWidth - _tipWidth) / 2;
            top = _eleTop + _eleHeight + distance;
          } else if (_tipDirec == 'left') {
            left = _eleLeft - _tipWidth - distance;
            top = _eleTop + (_eleHeight - _tipHeight) / 2;
          }

          $tip.css({
            'top': top,
            'left': left
          });

          return false;
        });


        if (config.event === 'hover') {
          $(ele).on(hideHandle, target, function() {
            $(this).next('.tooltip').remove();
          });
        } else {
          $(document).on(hideHandle, function(event) {
            $('.tooltip').remove();
          });
        }

      });
    }
  });

  /**
   * typeCount 组件
   * @description     字数统计，侦听input[type=text],textarea
   * @example
   * html    div.J-typeCount>input+span.count
   * js      $('.J-typeCount').IUI('typeCount');
   */
  $.fn.IUI({
    typeCount: function(options) {
      return this.each(function() {
        $(this).on('keyup', 'input[type=text],textarea', function(event) {
          event.preventDefault();
          var $this = $(this);
          var $target = $this.parent().find('span.count');
          var initCount = parseInt($target.text().split('/')[1]);
          var length = this.value.length;
          if (length > initCount) {
            $target.addClass('error');
          } else {
            $target.removeClass('error');
          }
          $target.html(length + '/' + initCount);
        });

        $(this).find('input,textarea').trigger('keyup');
      });
    }
  });
  (function() {

    var template = '<div class="IUI-dialog-container hide">' +
      '<div role="content"></div>' +
      '<div role="operate">' +
      '<a href="javascript:;" role="confirm" class="btn btn-primary">确定</a>' +
      '<a href="javascript:;" class="btn btn-default" role="cancel">取消</a>' +
      '</div>' +
      '</div>';
    var defaults = {
      handle: '[data-dialog]',
      container: 'body',
      offsetX: 0,
      offsetY: 10,
      compiler: null,
      data: {}
    };

    function Dialog(config) {
      this.$selector = $(config.handle);
      this.$template = $(template);
      this.$container = $(config.container);
      this.config = config;
      this.containerPos = $(config.container)[0].getBoundingClientRect();
      this.init();
    }

    Dialog.prototype.init = function() {
      var self = this;


      // show
      this.$container.on('click.IUI-dialog', this.config.handle, function(event) {
        var $this = $(this);
        var eventSpace = $this.data('id') ? ('.dialog-' + $this.data('id')) : '.dialog';
        $this.trigger('show' + eventSpace, [self]);
        self.show($this);
        $this.trigger('after' + eventSpace, [self]);
        event.stopPropagation();
      });

      // hide
      this.$container.on('click.IUI-dialog', function(event) {
        var $this = $(this);
        $this.trigger('hide.dialog', [self]);
        self.hide();
      });

      // cut bubbling
      this.$container.on('click', '.IUI-dialog-container', function(event) {
        event.stopPropagation();
      });

      // cancel
      this.$container.on('click', '.IUI-dialog-container [role="cancel"]', function(event) {
        var $this = $(this);
        var id = self.$template.data('caller').data('id');
        var eventSpace = id ? ('.dialog-' + id) : '.dialog';
        self.hide();
        $this.trigger('cancel' + eventSpace, [self]);
      });

      // confirm
      this.$container.on('click', '.IUI-dialog-container [role="confirm"]', function(event) {
        event.preventDefault();
        var $this = $(this);
        var id = self.$template.data('caller').data('id');
        var eventSpace = id ? ('.dialog-' + id) : '.dialog';
        $this.trigger('confirm' + eventSpace, [self]);

      });
    };

    Dialog.prototype.show = function(handle) {
      var config = this.config;
      var $handle = handle;
      var pos = handle[0].getBoundingClientRect();
      var handlePosX = pos.left;
      var handlePosY = pos.top;
      var containerPosX = this.containerPos.left;
      var containerPosY = this.containerPos.top;
      var handleWidth = $handle.outerWidth() / 2;
      var handleHeight = $handle.outerHeight();
      var $template = this.$template;
      var $content = $($handle.attr('data-dialog'));
      var content = config.compiler ? config.compiler($handle.attr('data-dialog').replace(/\#|\./, ''), config.data) : $content.html();
      var screenWidth = $(document).width();
      var screenHeight = $(document).height();
      var triPos = '';
      this.$container.css({ 'position': 'relative' });
      $template.find('[role="content"]').html(content);
      $template.appendTo(config.container).removeClass('hide');
      handlePosX -= $template.outerWidth() / 2 - handleWidth + config.offsetX;
      handlePosY -= containerPosY - handleHeight - this.$container.scrollTop() - config.offsetY;

      if (pos.left + $template.outerWidth() > screenWidth) {
        handlePosX = pos.left - ($template.outerWidth() - handleWidth * 2);
        triPos = 'right';
      } else if (pos.left === 0) {
        handlePosX = pos.left;
        triPos = 'left';
      }


      // 底部
      // 对象 top + dialog 高度 + 上下文 top 大于 屏幕高度 + 上下文滚动条
      if (handlePosY + $template.outerHeight() + containerPosY > screenHeight + this.$container.scrollTop()) {
        handlePosY = pos.top - containerPosY - $template.outerHeight() - config.offsetY + this.$container.scrollTop();
        triPos += 'top';
      }

      $template.removeClass('left right top').addClass(triPos).css({
        left: handlePosX,
        top: handlePosY
      }).data('caller', $handle).data('dialog', this);
    };

    Dialog.prototype.hide = function() {
      this.$container.removeAttr('style');
      this.$template.remove();
    };

    $.extend({
      dialog: function(config) {
        return new Dialog($.extend({}, defaults, config));
      }
    });
  }());

  (function() {

    /**
     * pageSize : 当前显示条数
     * total : 总计数值
     *
     */

    var tpl_pagesize = '每页<input type="text" class="pagesize" role="text" maxlength="2"  value="{{pageSize}}" >';

    var tpl_goto = '跳转至<input type="text" class="goto"  role="text" maxlength="2" data-maxpage="{{maxpage}}">';

    var template = '<div class="pagination-wrap clearfix">共{{total}}条&nbsp;&nbsp;{{size}}{{goto}}<ul class="pagination">{{queue}}</ul></div>';

    var URLToArray = function(url) {
      var request = {},
        pairs = url.substring(url.indexOf('?') + 1).split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return request;
    };

    var ArrayToURL = function(array) {
      var pairs = [];
      for (var key in array)
        if (array.hasOwnProperty(key)) pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(array[key]));
      return pairs.join('&');
    };

    var defaults = {
      url: 'http://192.168.0.66:8080/new-media/userController/nmUserPage',
      param: {
        curPage: 1,
        pageSize: 20
      },
      type: 'POST',
      maxQueue: 5,
      goTo: false,
      pageSize: true,
      cache: false,
      click: function(pagination) {
        var $this = $(this);
        var self = pagination;
        var response = self.response;
        var paramsArr = URLToArray(self.config.param);

        if ($this.hasClass('prev')) {
          paramsArr.curPage = response.curPage - 1;
        } else if ($this.hasClass('next')) {
          paramsArr.curPage = response.curPage + 1;
        } else if ($this.hasClass('pagesize')) {
          $('[name="pageSize"]').val(this.value);
          paramsArr.pageSize = this.value;
        } else if ($this.hasClass('goto')) {
          var pageCount = this.value;
          if (parseInt(pageCount) > response.pageCount) {
            $.tip({
              text: '最大页数是第' + response.pageCount + '页',
              timeout: 1500,
              status: 0
            });
            pageCount = response.pageCount;
          }
          $('[name="curPage"]').val(pageCount);
          paramsArr.curPage = pageCount;
        } else {
          paramsArr.curPage = $this.data('page');
        }
        return ArrayToURL(paramsArr);
      }

    };



    function Pagination(config, selector) {
      this.cache = {};
      this.config = $.extend({}, defaults, config);
      this.$selector = selector;
      this.response = null;
      this._cache = {};
      this.init();
      this.get();
    }

    Pagination.prototype.init = function() {
      var self = this;

      this.$selector.on('click', '.prev', function(event) {
        if ($(this).hasClass('disabled')) {
          return false;
        }
        var params = self.config.click.call(this, self);

        self.get(params);
        return false;
      });

      this.$selector.on('click', '.next', function(event) {
        if ($(this).hasClass('disabled')) {
          return false;
        }
        var params = self.config.click.call(this, self);
        self.get(params);
        return false;

      });

      this.$selector.on('click', 'li[data-page]', function(event) {
        event.preventDefault();
        if ($(this).hasClass('active')) {
          return false;
        }
        var params = self.config.click.call(this, self);
        self.get(params);
        return false;
      });

      this.$selector.on('keyup', '.pagesize,.goto', function(event) {
        if (event.keyCode === 13) {
          var params = self.config.click.call(this, self);
          self.get(params);
        }
      });
    };

    Pagination.prototype.get = function(param, refresh) {
      var self = this;
      var config = self.config;
      var data = param ? (config.param = param) : config.param;

      if (self.cache && self._cache[param] && !refresh) {
        self.$selector.trigger('get.success', [self._cache[param], self]);
        return false;
      }
      $.ajax({
        url: config.url,
        type: config.type,
        dataType: 'json',
        data: data
      }).then(function(res) {
        if (config.cache) {
          self._cache[param] = res;
        }
        self.$selector.trigger('get.success', [res, self]);
      }, function(err) {
        self.$selector.trigger('get.error', [err, self]);
      });
    };

    Pagination.prototype.render = function(response) {
      var result = '';
      var tpl = template;
      var data = this.response = response;
      var config = this.config;

      tpl = tpl.replace('{{size}}', config.pageSize ? tpl_pagesize : '').replace('{{goto}}', config.goTo ? tpl_goto : '');

      $.each(data, function(name, value) {
        var reg = new RegExp('\{\{' + name + '\}\}', 'gmi');
        tpl = tpl.replace(reg, value);
      });


      var queueItem = '';

      var queuePrev = '<li class="prev ' + (data.curPage === 1 ? 'disabled' : '') + '"><a href="javascript:;">«</a></li>';

      var queueNext = '<li class="next ' + (data.pageCount === 0 || data.curPage === data.pageCount ? 'disabled' : '') + '"><a href="javascript:;">»</a></li>';

      var queueLength = data.pageCount > config.maxQueue ? config.maxQueue : data.pageCount;

      var step = Math.ceil(config.maxQueue / 2);

      var i = 1;


      if (data.pageCount > config.maxQueue && data.curPage > step) {

        i = data.curPage - (step - 1);
        queueLength = data.curPage + step > data.pageCount ? data.pageCount : data.curPage + step - 1;


        //当页数接近末尾，且小于默认尺寸
        if (queueLength - (i - 1) < config.maxQueue) {

          i = data.pageCount - (config.maxQueue - 1);

        }
      }

      for (; i <= queueLength; i++) {
        queueItem += '<li ' + (data.curPage === i ? 'class="active"' : '') + ' data-page="' + i + '"><a href="javascript:;">' + i + '</a></li>';
      }

      var queueHtml = queuePrev + queueItem + queueNext;

      tpl = tpl.replace('{{queue}}', queueHtml);

      this.$selector.html(tpl);

    };


    $.fn.IUI({
      pagination: function(config) {
        return new Pagination(config, this);
      }
    });

  }());
}(jQuery, window, document, undefined));



// WEBPACK FOOTER //
// ./js/plugins/iui.js