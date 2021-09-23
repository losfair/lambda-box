(function() {

let loadingTextA = "加载中";
let loadingTextB = "点击加载更多";
let loadingTextC = "没有更早的问题";
let lastIndex = 0;
let reloadAllowed = true;

function padTwoDigitDateElem(v) {
    let s = "" + v;
    if(s.length == 1) {
        s = "0" + s;
    }
    return s;
}

/**
 * 
 * @param {Date} targetDate 
 */
function formatDate(targetDate) {
    let now = new Date();
    let yesterday = new Date(Date.now() - 86400000);
    let s = "";
    if(targetDate.toLocaleDateString() == now.toLocaleDateString()) {
        s = "今天";
    } else if(targetDate.toLocaleDateString() == yesterday.toLocaleDateString()) {
        s = "昨天";
    } else {
        s = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
    }
    s += ` ${padTwoDigitDateElem(targetDate.getHours())}:${padTwoDigitDateElem(targetDate.getMinutes())}`;
    return s;
}

window.submitQuestion = async function () {
    let textarea = document.getElementById("question-area");
    let sendBtn = document.getElementById("send-btn");

    textarea.disabled = true;
    sendBtn.disabled = true;

    let res = await fetch("/api/add_question", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            text: textarea.value,
            owner_ghid: lb_ownerGhid,
        }),
    });

    if(res.ok) {
        textarea.value = "";
        textarea.disabled = false;
        document.getElementById("question-area").style.display = "none";
        document.getElementById("send-btn").style.display = "none";
        document.getElementById("success-hint").innerHTML = "谢谢你的提问！<br>问题被回答后将会显示在这里。";
    } else {
        let text = await res.text();
        alert("add_question: " + text);
        textarea.disabled = false;
        sendBtn.disabled = false;
    }
}
    
window.questionInputOnce = function(event) {
    let sendBtn = document.getElementById("send-btn");
    if(event.target.value) {
        sendBtn.disabled = false;
    } else {
        sendBtn.disabled = true;
    }
}

window.updateQuestionList = async function() {
    if(!reloadAllowed) return;
    reloadAllowed = false;
    document.getElementById("loading-box").innerHTML = loadingTextA;

    let res = await fetch("/api/get_questions", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            before: lastIndex,
            owner_ghid: lb_ownerGhid,
        }),
    });
    if(!res.ok) {
        throw new Error("fetch questions: " + await res.text());
    }
    let list = (await res.json()).questions;
    console.log(list);

    let box = document.getElementById("question-list");
    for(let { id, entry } of list) {
        lastIndex = id;

        let elem = document.createElement("div");
        elem.classList.add("qa-box");

        let timeBox = document.createElement("p");
        timeBox.classList.add("qa-time-box");
        timeBox.innerHTML = formatDate(new Date(entry.time));
        elem.appendChild(timeBox);

        let responseShadowBox;
        let responseBox;

        let questionBox = document.createElement("p");
        questionBox.classList.add("qa-question-box");
        questionBox.innerText = entry.question;
        questionBox.addEventListener("click", () => {
            responseShadowBox.style.display = "block";
            responseBox.style.display = "inline-block";
        });
        elem.appendChild(questionBox);

        responseShadowBox = document.createElement("div");
        responseShadowBox.classList.add("qa-response-shadow-box");
        responseShadowBox.addEventListener("click", () => {
            responseShadowBox.style.display = "none";
            responseBox.style.display = "none";
        });
        elem.appendChild(responseShadowBox);

        responseBox = document.createElement("div");
        responseBox.classList.add("qa-response-box");
        responseBox.innerText = entry.response;
        responseBox.innerHTML = "<p>回答</p>" + responseBox.innerHTML;
        elem.appendChild(responseBox);

        box.appendChild(elem);
    }

    document.getElementById("loading-box").innerHTML = list.length ? loadingTextB : loadingTextC;
    reloadAllowed = true;
}

})();

window.addEventListener("load", () => {
    updateQuestionList();
});
