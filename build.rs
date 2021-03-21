#![allow(unused)]
use std::process::Command;
use std::io;
#[cfg(windows)] use winres::WindowsResource;

fn main() {
  if cfg!(target_os = "windows") {
    Command::new("packfolder.exe")
      .args(&["app", "target/app.rc", "-binary"])
      .output()
      .expect("Unable to run packfolder.exe!");
      WindowsResource::new()
        .set_icon("icon.ico")
        .compile();
    }
}